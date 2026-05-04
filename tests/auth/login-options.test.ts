import { describe, expect, test } from 'vitest'
import { loginOptions, walletLoginOptions, oauthLoginOptions } from '@/lib/login-options'

describe('login options', () => {
  test('keeps wallet and OAuth buttons in the requested order', () => {
    expect(loginOptions.map((option) => option.label)).toEqual([
      'Rainbow',
      'Base Account',
      'MetaMask',
      'WalletConnect',
      'GitHub',
      'Google'
    ])
  })

  test('uses MXStore login button copy for every provider', () => {
    expect(loginOptions.map((option) => option.buttonText)).toEqual([
      '使用 Rainbow 登录',
      '使用 Base Account 登录',
      '使用 MetaMask 登录',
      '使用 WalletConnect 登录',
      '使用 GitHub 登录',
      '使用 Google 登录'
    ])
  })

  test('separates wallet and Supabase OAuth providers', () => {
    expect(walletLoginOptions.map((option) => option.id)).toEqual([
      'rainbow',
      'base-account',
      'metamask',
      'walletconnect'
    ])
    expect(oauthLoginOptions.map((option) => option.provider)).toEqual(['github', 'google'])
  })
})
