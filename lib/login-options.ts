export type WalletLoginId = 'rainbow' | 'base-account' | 'metamask' | 'walletconnect'
export type OauthLoginProvider = 'github' | 'google'

export type WalletLoginOption = {
  type: 'wallet'
  id: WalletLoginId
  label: string
  buttonText: string
  connectorName: string
}

export type OauthLoginOption = {
  type: 'oauth'
  id: OauthLoginProvider
  provider: OauthLoginProvider
  label: string
  buttonText: string
  href: string
}

export const walletLoginOptions = [
  {
    type: 'wallet',
    id: 'rainbow',
    label: 'Rainbow',
    buttonText: '使用 Rainbow 登录',
    connectorName: 'Rainbow'
  },
  {
    type: 'wallet',
    id: 'base-account',
    label: 'Base Account',
    buttonText: '使用 Base Account 登录',
    connectorName: 'Base Account'
  },
  {
    type: 'wallet',
    id: 'metamask',
    label: 'MetaMask',
    buttonText: '使用 MetaMask 登录',
    connectorName: 'MetaMask'
  },
  {
    type: 'wallet',
    id: 'walletconnect',
    label: 'WalletConnect',
    buttonText: '使用 WalletConnect 登录',
    connectorName: 'WalletConnect'
  }
] satisfies WalletLoginOption[]

export const oauthLoginOptions = [
  {
    type: 'oauth',
    id: 'github',
    provider: 'github',
    label: 'GitHub',
    buttonText: '使用 GitHub 登录',
    href: '/auth/oauth?provider=github'
  },
  {
    type: 'oauth',
    id: 'google',
    provider: 'google',
    label: 'Google',
    buttonText: '使用 Google 登录',
    href: '/auth/oauth?provider=google'
  }
] satisfies OauthLoginOption[]

export const loginOptions = [...walletLoginOptions, ...oauthLoginOptions]
