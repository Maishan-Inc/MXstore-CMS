import { describe, expect, test } from 'vitest'
import { normalizeDomain, normalizeOpenListBaseUrl } from '@/lib/admin/domains'

describe('admin domain helpers', () => {
  test('normalizes domain input from full url', () => {
    expect(normalizeDomain('https://oss-us-hk.smvapi.store/p/one/file.zip')).toBe('oss-us-hk.smvapi.store')
  })

  test('normalizes openlist base url without trailing slash', () => {
    expect(normalizeOpenListBaseUrl('https://oss-us-hk.smvapi.store/')).toBe('https://oss-us-hk.smvapi.store')
  })
})
