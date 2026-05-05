import { describe, expect, test } from 'vitest'
import { adminNavigationItems, isAdminPath } from '@/lib/admin/navigation'

describe('admin navigation helpers', () => {
  test('marks admin urls as admin paths', () => {
    expect(isAdminPath('/admin')).toBe(true)
    expect(isAdminPath('/admin/apps')).toBe(true)
    expect(isAdminPath('/dashboard')).toBe(false)
  })

  test('contains expected admin sections', () => {
    expect(adminNavigationItems.map((item) => item.href)).toEqual([
      '/admin',
      '/admin/apps',
      '/admin/download-links',
      '/admin/settings/domains',
      '/admin/settings/packages',
      '/admin/orders',
      '/admin/users',
      '/admin/statistics',
      '/admin/settings'
    ])
  })
})
