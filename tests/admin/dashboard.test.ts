import { describe, expect, test } from 'vitest'
import { getDashboardMetrics } from '@/lib/admin/dashboard'

describe('admin dashboard helpers', () => {
  test('builds dashboard metrics from aggregate values', () => {
    expect(getDashboardMetrics({
      appCount: 12,
      todayDownloadCount: 34,
      confirmedPaymentCount: 8,
      activeUserCount: 21
    })).toEqual([
      { label: '应用总数', value: '12' },
      { label: '今日下载', value: '34' },
      { label: '付费订单', value: '8' },
      { label: '活跃用户', value: '21' }
    ])
  })
})
