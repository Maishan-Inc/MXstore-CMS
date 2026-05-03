import { describe, expect, test } from 'vitest'
import { packageFormDefaults, normalizePackagePayload } from '@/lib/admin/packages'

describe('admin package helpers', () => {
  test('builds package defaults for create form', () => {
    expect(packageFormDefaults()).toEqual({
      id: null,
      name: '',
      bytes_amount: '',
      chain_id: 8453,
      asset_type: 'native',
      token_contract: '',
      token_symbol: '',
      token_decimals: '',
      amount_raw: '',
      pay_to_address: '',
      enabled: true
    })
  })

  test('normalizes existing package data for edit form', () => {
    expect(normalizePackagePayload({
      id: 'pkg-1',
      name: '100GB 流量包',
      bytes_amount: 107374182400,
      chain_id: 8453,
      asset_type: 'erc20',
      token_contract: '0xabc',
      token_symbol: 'USDT',
      token_decimals: 6,
      amount_raw: '1000000',
      pay_to_address: '0xdef',
      enabled: false
    })).toEqual({
      id: 'pkg-1',
      name: '100GB 流量包',
      bytes_amount: '107374182400',
      chain_id: 8453,
      asset_type: 'erc20',
      token_contract: '0xabc',
      token_symbol: 'USDT',
      token_decimals: '6',
      amount_raw: '1000000',
      pay_to_address: '0xdef',
      enabled: false
    })
  })
})
