import { describe, expect, test } from 'vitest'
import { formatBytes, formatMoney } from '@/lib/format'

describe('formatBytes', () => {
  test('returns unknown size for null/undefined/0', () => {
    expect(formatBytes(null)).toBe('未知大小')
    expect(formatBytes(undefined)).toBe('未知大小')
    expect(formatBytes(0)).toBe('未知大小')
  })

  test('formats bytes', () => {
    expect(formatBytes(1)).toBe('1 B')
    expect(formatBytes(512)).toBe('512 B')
  })

  test('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB')
    expect(formatBytes(1536)).toBe('1.5 KB')
  })

  test('formats megabytes', () => {
    expect(formatBytes(1048576)).toBe('1.0 MB')
    expect(formatBytes(5242880)).toBe('5.0 MB')
  })

  test('formats gigabytes', () => {
    expect(formatBytes(1073741824)).toBe('1.0 GB')
    expect(formatBytes(10737418240)).toBe('10 GB')
  })

  test('formats terabytes', () => {
    expect(formatBytes(1099511627776)).toBe('1.0 TB')
  })
})

describe('formatMoney', () => {
  test('returns free for null/undefined/0', () => {
    expect(formatMoney(null)).toBe('免费')
    expect(formatMoney(undefined)).toBe('免费')
    expect(formatMoney(0)).toBe('免费')
  })

  test('formats cents to currency', () => {
    expect(formatMoney(100)).toContain('1')
    expect(formatMoney(1250)).toContain('12.5')
  })

  test('uses specified currency', () => {
    const result = formatMoney(1000, 'CNY')
    expect(result).toBeDefined()
  })
})
