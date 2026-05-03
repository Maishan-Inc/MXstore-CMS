import { describe, expect, test } from 'vitest'
import { getShellTitle } from '@/lib/admin/layout'

describe('admin layout helpers', () => {
  test('returns section title for known admin routes', () => {
    expect(getShellTitle('/admin')).toBe('管理员仪表盘')
    expect(getShellTitle('/admin/apps')).toBe('应用管理')
    expect(getShellTitle('/admin/settings/domains')).toBe('域名与 Token')
  })

  test('falls back to generic title for unknown admin routes', () => {
    expect(getShellTitle('/admin/unknown')).toBe('管理员后台')
  })
})
