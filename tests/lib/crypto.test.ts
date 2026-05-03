import { describe, expect, test, beforeAll } from 'vitest'

beforeAll(() => {
  process.env.APP_SECRET = 'test-secret-key-for-crypto-tests'
})

describe('crypto helpers', async () => {
  const { encryptSecret, decryptSecret, sealJson, unsealJson } = await import('@/lib/crypto')

  test('encrypts and decrypts roundtrip', () => {
    const plain = 'my-admin-token-12345'
    const encrypted = encryptSecret(plain)
    expect(encrypted).not.toBe(plain)
    const decrypted = decryptSecret(encrypted)
    expect(decrypted).toBe(plain)
  })

  test('encrypts to dot-separated base64url format', () => {
    const encrypted = encryptSecret('test')
    const parts = encrypted.split('.')
    expect(parts).toHaveLength(3)
  })

  test('fails to decrypt tampered payload', () => {
    const encrypted = encryptSecret('secret')
    const tampered = encrypted.slice(0, -2) + 'XX'
    expect(() => decryptSecret(tampered)).toThrow()
  })

  test('seals and unseals JSON roundtrip', () => {
    const data = { userId: 'abc', role: 'admin', count: 42 }
    const sealed = sealJson(data)
    expect(sealed).toContain('.')
    const unsealed = unsealJson<typeof data>(sealed)
    expect(unsealed).toEqual(data)
  })

  test('unsealJson returns null for invalid input', () => {
    expect(unsealJson(undefined)).toBeNull()
    expect(unsealJson('')).toBeNull()
    expect(unsealJson('invalid')).toBeNull()
  })

  test('unsealJson returns null for tampered seal', () => {
    const sealed = sealJson({ a: 1 })
    const tampered = sealed.slice(0, -3) + 'XXX'
    expect(unsealJson(tampered)).toBeNull()
  })
})
