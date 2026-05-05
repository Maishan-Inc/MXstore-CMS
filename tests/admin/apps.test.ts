import { describe, expect, test } from 'vitest'
import { appFormDefaults, normalizeAppPayload } from '@/lib/admin/apps'

describe('admin app helpers', () => {
  test('builds create defaults with one empty download link', () => {
    expect(appFormDefaults()).toEqual({
      name: '',
      slug: '',
      description: '',
      version: '',
      platform: '',
      logo_url: '',
      developer_name: '',
      developer_avatar_url: '',
      category_id: '',
      download_permission: 'login',
      is_paid: false,
      price_cents: 0,
      currency: 'USD',
      published: true,
      links: [
        {
          id: null,
          name: '主下载',
          input_url: '',
          file_size_bytes: '',
          charge_traffic: true,
          sort_order: 0
        }
      ]
    })
  })

  test('normalizes existing app data for edit form', () => {
    const result = normalizeAppPayload({
      name: 'MX Player',
      slug: 'mx-player',
      description: null,
      version: '1.0.0',
      platform: null,
      logo_url: null,
      is_paid: true,
      price_cents: 1200,
      currency: 'USD',
      published: false,
      app_links: [
        {
          id: 'link-1',
          name: 'Windows 包',
          input_url: 'https://example.com/file.zip',
          file_size_bytes: 2048,
          charge_traffic: false,
          sort_order: 3
        }
      ]
    })

    expect(result).toEqual({
      name: 'MX Player',
      slug: 'mx-player',
      description: '',
      version: '1.0.0',
      platform: '',
      logo_url: '',
      developer_name: '',
      developer_avatar_url: '',
      category_id: '',
      download_permission: 'purchase',
      is_paid: true,
      price_cents: 1200,
      currency: 'USD',
      published: false,
      links: [
        {
          id: 'link-1',
          name: 'Windows 包',
          input_url: 'https://example.com/file.zip',
          file_size_bytes: '2048',
          charge_traffic: false,
          sort_order: 3
        }
      ]
    })
  })
})
