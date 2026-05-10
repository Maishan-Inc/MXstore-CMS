import 'server-only'
import crypto from 'node:crypto'

function key() {
  const secret = process.env.APP_SECRET ?? process.env.SIWE_SESSION_SECRET
  if (!secret) throw new Error('Missing required env: APP_SECRET or SIWE_SESSION_SECRET')
  return crypto.createHash('sha256').update(secret).digest()
}

export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const ciphertext = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join('.')
}

export function decryptSecret(payload: string): string {
  const [ivB64, tagB64, ciphertextB64] = payload.split('.')
  if (!ivB64 || !tagB64 || !ciphertextB64) throw new Error('Invalid encrypted secret')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivB64, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'))
  const clear = Buffer.concat([decipher.update(Buffer.from(ciphertextB64, 'base64url')), decipher.final()])
  return clear.toString('utf8')
}

export function hmac(input: string): string {
  return crypto.createHmac('sha256', key()).update(input).digest('base64url')
}

export function sealJson(value: unknown): string {
  const body = Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${body}.${hmac(body)}`
}

export type UnsealJsonResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: 'missing' | 'invalid_format' | 'invalid_signature' | 'invalid_json'; message: string }

export function unsealJsonResult<T>(sealed?: string): UnsealJsonResult<T> {
  if (!sealed) {
    return { ok: false, reason: 'missing', message: 'Missing sealed cookie value' }
  }

  const [body, sig] = sealed.split('.')
  if (!body || !sig) {
    return { ok: false, reason: 'invalid_format', message: 'Invalid sealed cookie format' }
  }

  const expected = hmac(body)
  const signature = Buffer.from(sig)
  const expectedSignature = Buffer.from(expected)
  if (signature.length !== expectedSignature.length || !crypto.timingSafeEqual(signature, expectedSignature)) {
    return { ok: false, reason: 'invalid_signature', message: 'Sealed cookie signature mismatch' }
  }

  try {
    return { ok: true, value: JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T }
  } catch (error) {
    return {
      ok: false,
      reason: 'invalid_json',
      message: error instanceof Error ? `Invalid sealed cookie JSON: ${error.message}` : 'Invalid sealed cookie JSON'
    }
  }
}

export function unsealJson<T>(sealed?: string): T | null {
  const result = unsealJsonResult<T>(sealed)
  return result.ok ? result.value : null
}
