import 'server-only'
import crypto from 'node:crypto'
import { getS3SecretAccessKey, type KycSettings } from '@/lib/kyc-settings'

type UploadInput = {
  key: string
  body: Buffer
  contentType: string
}

function sha256(value: string | Buffer) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function hmac(key: Buffer | string, value: string) {
  return crypto.createHmac('sha256', key).update(value).digest()
}

function encodePath(value: string) {
  return value.split('/').map((part) => encodeURIComponent(part)).join('/')
}

function signingKey(secretAccessKey: string, date: string, region: string) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, date)
  const regionKey = hmac(dateKey, region)
  const serviceKey = hmac(regionKey, 's3')
  return hmac(serviceKey, 'aws4_request')
}

function amzDate(date = new Date()) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, '')
  return {
    longDate: iso,
    shortDate: iso.slice(0, 8)
  }
}

function objectUrl(settings: KycSettings['s3'], key: string) {
  const endpoint = settings.endpoint.replace(/\/$/, '')
  if (settings.pathStyle) {
    return new URL(`${endpoint}/${settings.bucket}/${encodePath(key)}`)
  }

  const url = new URL(endpoint)
  url.hostname = `${settings.bucket}.${url.hostname}`
  url.pathname = `/${encodePath(key)}`
  return url
}

export async function putS3Object(settings: KycSettings, input: UploadInput) {
  if (!settings.s3.enabled) throw new Error('S3 远程存储未启用')
  if (!settings.s3.endpoint || !settings.s3.bucket || !settings.s3.accessKeyId) {
    throw new Error('S3 endpoint、bucket 或 accessKeyId 未配置')
  }

  const secretAccessKey = getS3SecretAccessKey(settings)
  if (!secretAccessKey) throw new Error('S3 secretAccessKey 未配置')

  const url = objectUrl(settings.s3, input.key)
  const { longDate, shortDate } = amzDate()
  const payloadHash = sha256(input.body)
  const region = settings.s3.region || 'auto'
  const host = url.host
  const canonicalHeaders = [
    `content-type:${input.contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${longDate}`
  ].join('\n')
  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'
  const canonicalRequest = [
    'PUT',
    url.pathname,
    '',
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash
  ].join('\n')
  const credentialScope = `${shortDate}/${region}/s3/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    longDate,
    credentialScope,
    sha256(canonicalRequest)
  ].join('\n')
  const signature = crypto
    .createHmac('sha256', signingKey(secretAccessKey, shortDate, region))
    .update(stringToSign)
    .digest('hex')

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `AWS4-HMAC-SHA256 Credential=${settings.s3.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      'Content-Type': input.contentType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': longDate
    },
    body: new Uint8Array(input.body) as BodyInit
  })

  if (!response.ok) {
    throw new Error(`S3 上传失败 ${response.status}: ${await response.text()}`)
  }

  const publicBaseUrl = settings.s3.publicBaseUrl.replace(/\/$/, '')
  return {
    key: input.key,
    url: publicBaseUrl ? `${publicBaseUrl}/${encodePath(input.key)}` : url.toString()
  }
}

export function safeStorageFileName(originalName: string) {
  const normalized = originalName
    .normalize('NFKD')
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return normalized || 'document'
}
