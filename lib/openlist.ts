import 'server-only'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret } from '@/lib/crypto'

type TokenDomain = {
  id: string
  domain: string
  openlist_base_url: string
  encrypted_admin_token: string
  sign_ttl_seconds: number
  enabled: boolean
}

export function encodePathBySegment(path: string) {
  return path
    .split('/')
    .map((part, index) => (index === 0 ? '' : encodeURIComponent(part)))
    .join('/')
}

export function toOpenListPath(inputUrl: string): { hostname: string; encodedPath: string; openlistPath: string } {
  const url = new URL(inputUrl)
  const encodedPath = url.pathname.replace(/^\/p(?=\/)/, '').replace(/^\/d(?=\/)/, '')
  const normalized = encodedPath.startsWith('/') ? encodedPath : `/${encodedPath}`
  return {
    hostname: url.hostname.toLowerCase(),
    encodedPath: normalized,
    openlistPath: decodeURIComponent(normalized)
  }
}

export function makeOpenListSign(openlistPath: string, adminToken: string, ttlSeconds: number) {
  const expireTimeStamp = ttlSeconds === 0 ? 0 : Math.floor(Date.now() / 1000) + ttlSeconds
  const toSign = `${openlistPath}:${expireTimeStamp}`
  const safeBase64 = crypto
    .createHmac('sha256', adminToken)
    .update(toSign)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  // Keep trailing '='. OpenList's safeBase64 variant keeps padding.
  return `${safeBase64}:${expireTimeStamp}`
}

export async function findTokenDomainByUrl(inputUrl: string): Promise<TokenDomain | null> {
  const { hostname } = toOpenListPath(inputUrl)
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('token_domains')
    .select('id,domain,openlist_base_url,encrypted_admin_token,sign_ttl_seconds,enabled')
    .eq('domain', hostname)
    .eq('enabled', true)
    .maybeSingle()
  if (error) throw error
  return data as TokenDomain | null
}

export async function makeSignedDownloadUrl(inputUrl: string) {
  return makeSignedOpenListUrl(inputUrl)
}

export async function makeSignedOpenListUrl(inputUrl: string) {
  const domain = await findTokenDomainByUrl(inputUrl)
  if (!domain) return { kind: 'external' as const, url: inputUrl, openlistPath: null, expiresAt: null }

  const { openlistPath } = toOpenListPath(inputUrl)
  const token = decryptSecret(domain.encrypted_admin_token)
  const sign = makeOpenListSign(openlistPath, token, domain.sign_ttl_seconds)
  const base = domain.openlist_base_url.replace(/\/$/, '')
  const url = `${base}/d${encodePathBySegment(openlistPath)}?sign=${encodeURIComponent(sign)}`
  const expiresAt = domain.sign_ttl_seconds === 0 ? null : new Date(Date.now() + domain.sign_ttl_seconds * 1000)
  return { kind: 'openlist' as const, url, openlistPath, expiresAt }
}

export async function resolveSignedOpenListUrl(inputUrl: string | null | undefined) {
  if (!inputUrl) return null
  try {
    return (await makeSignedOpenListUrl(inputUrl)).url
  } catch {
    return inputUrl
  }
}
