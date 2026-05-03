import 'server-only'
import crypto from 'node:crypto'
import { requiredEnv } from '@/lib/env'

function key() {
  return crypto.createHash('sha256').update(requiredEnv('APP_SECRET')).digest()
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

export function unsealJson<T>(sealed?: string): T | null {
  if (!sealed) return null
  const [body, sig] = sealed.split('.')
  if (!body || !sig) return null
  const expected = hmac(body)
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null
  return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T
}
