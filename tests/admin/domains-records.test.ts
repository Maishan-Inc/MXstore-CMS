import { describe, expect, test } from 'vitest'
import { domainFormDefaults, normalizeDomainPayload } from '@/lib/admin/domain-records'

describe('admin domain record helpers', () => {
  test('builds domain defaults for create form', () => {
    expect(domainFormDefaults()).toEqual({
      id: null,
      domain: '',
      openlist_base_url: '',
      admin_token: '',
      sign_ttl_seconds: 300,
      enabled: true
    })
  })

  test('normalizes existing domain data for edit form without exposing token', () => {
    expect(normalizeDomainPayload({
      id: 'domain-1',
      domain: 'oss-us-hk.smvapi.store',
      openlist_base_url: 'https://oss-us-hk.smvapi.store',
      sign_ttl_seconds: 600,
      enabled: false
    })).toEqual({
      id: 'domain-1',
      domain: 'oss-us-hk.smvapi.store',
      openlist_base_url: 'https://oss-us-hk.smvapi.store',
      admin_token: '',
      sign_ttl_seconds: 600,
      enabled: false
    })
  })
})
