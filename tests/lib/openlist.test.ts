import { describe, expect, test } from 'vitest'
import { toOpenListPath, encodePathBySegment, makeOpenListSign } from '@/lib/openlist'

describe('toOpenListPath', () => {
  test('parses OpenList /p/ URL', () => {
    const result = toOpenListPath('http://oss-us-hk.smvapi.store/p/one/%E7%BD%97%E5%B0%8F%E9%BB%91%E6%88%98%E8%AE%B0/file.mkv')
    expect(result.hostname).toBe('oss-us-hk.smvapi.store')
    expect(result.openlistPath).toBe('/one/罗小黑战记/file.mkv')
  })

  test('parses URL without /p/ prefix', () => {
    const result = toOpenListPath('http://example.com/one/file.txt')
    expect(result.hostname).toBe('example.com')
    expect(result.openlistPath).toBe('/one/file.txt')
  })

  test('normalizes hostname to lowercase', () => {
    const result = toOpenListPath('http://EXAMPLE.COM/path/file.txt')
    expect(result.hostname).toBe('example.com')
  })

  test('strips /d/ prefix', () => {
    const result = toOpenListPath('http://example.com/d/one/file.txt')
    expect(result.hostname).toBe('example.com')
    expect(result.openlistPath).toBe('/one/file.txt')
  })
})

describe('encodePathBySegment', () => {
  test('encodes path segments', () => {
    expect(encodePathBySegment('/one/文件.txt')).toBe('/one/%E6%96%87%E4%BB%B6.txt')
  })

  test('preserves leading slash', () => {
    expect(encodePathBySegment('/simple/path')).toBe('/simple/path')
  })

  test('encodes spaces', () => {
    expect(encodePathBySegment('/path/my file.txt')).toBe('/path/my%20file.txt')
  })
})

describe('makeOpenListSign', () => {
  test('generates sign with correct format', () => {
    const sign = makeOpenListSign('/test/path', 'test-token', 300)
    const parts = sign.split(':')
    expect(parts).toHaveLength(2)
    expect(parts[0]).toBeTruthy()
    expect(Number(parts[1])).toBeGreaterThan(0)
  })

  test('generates consistent sign for same inputs', () => {
    const sign1 = makeOpenListSign('/path', 'token', 0)
    const sign2 = makeOpenListSign('/path', 'token', 0)
    expect(sign1).toBe(sign2)
  })

  test('generates different sign for different paths', () => {
    const sign1 = makeOpenListSign('/path1', 'token', 0)
    const sign2 = makeOpenListSign('/path2', 'token', 0)
    expect(sign1).not.toBe(sign2)
  })

  test('uses 0 expiry when ttl is 0', () => {
    const sign = makeOpenListSign('/path', 'token', 0)
    expect(sign).toMatch(/:0$/)
  })
})
