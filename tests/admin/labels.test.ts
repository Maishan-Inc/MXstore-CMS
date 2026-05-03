import { describe, expect, test } from 'vitest'
import { getPaymentStatusTone, getRoleTone } from '@/lib/admin/labels'

describe('admin label helpers', () => {
  test('maps payment statuses to badge tones', () => {
    expect(getPaymentStatusTone('confirmed')).toBe('success')
    expect(getPaymentStatusTone('pending')).toBe('muted')
    expect(getPaymentStatusTone('rejected')).toBe('danger')
  })

  test('maps user roles to badge tones', () => {
    expect(getRoleTone('admin')).toBe('info')
    expect(getRoleTone('user')).toBe('muted')
  })
})
