'use client'

import Link from 'next/link'
import type { Connector } from 'wagmi'
import { SiweMessage } from 'siwe'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useAccount, useChainId, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { oauthLoginOptions, type WalletLoginOption } from '@/lib/login-options'

type RkConnector = Connector & {
  rkDetails?: {
    name?: string
    iconUrl?: string | (() => Promise<string>)
  }
}

type PasswordLoginResponse =
  | { ok: true; next: string }
  | { ok: false; error: string }

type VisualLoginOption =
  | (WalletLoginOption & { visualId: VisualProviderId })
  | {
      type: 'oauth'
      id: 'github' | 'google'
      label: string
      buttonText: string
      href: string
      visualId: VisualProviderId
    }
  | {
      type: 'password'
      id: 'maishan'
      label: string
      buttonText: string
      visualId: VisualProviderId
    }

type VisualProviderId =
  | 'tronlink'
  | 'binance-wallet'
  | 'metamask'
  | 'trust-wallet'
  | 'okx-wallet'
  | 'tokenpocket'
  | 'github'
  | 'google'
  | 'maishan'

const visualLoginOptions: VisualLoginOption[] = [
  {
    type: 'wallet',
    id: 'walletconnect',
    visualId: 'tronlink',
    label: 'TronLink',
    buttonText: '使用 TronLink 登录',
    connectorName: 'TronLink'
  },
  {
    type: 'wallet',
    id: 'walletconnect',
    visualId: 'binance-wallet',
    label: 'Binance Wallet',
    buttonText: '使用 Binance Wallet 登录',
    connectorName: 'Binance Wallet'
  },
  {
    type: 'wallet',
    id: 'metamask',
    visualId: 'metamask',
    label: 'MetaMask',
    buttonText: '使用 MetaMask 登录',
    connectorName: 'MetaMask'
  },
  {
    type: 'wallet',
    id: 'walletconnect',
    visualId: 'trust-wallet',
    label: 'Trust Wallet',
    buttonText: '使用 Trust Wallet 登录',
    connectorName: 'Trust Wallet'
  },
  {
    type: 'wallet',
    id: 'walletconnect',
    visualId: 'okx-wallet',
    label: 'OKX Wallet',
    buttonText: '使用 OKX Wallet 登录',
    connectorName: 'OKX Wallet'
  },
  {
    type: 'wallet',
    id: 'walletconnect',
    visualId: 'tokenpocket',
    label: 'TokenPocket',
    buttonText: '使用 TokenPocket 登录',
    connectorName: 'TokenPocket'
  },
  {
    type: 'oauth',
    id: 'github',
    visualId: 'github',
    label: 'GitHub',
    buttonText: '使用 GitHub 登录',
    href: oauthLoginOptions.find((option) => option.id === 'github')?.href ?? '/auth/oauth?provider=github'
  },
  {
    type: 'oauth',
    id: 'google',
    visualId: 'google',
    label: 'Google',
    buttonText: '使用 Google 登录',
    href: oauthLoginOptions.find((option) => option.id === 'google')?.href ?? '/auth/oauth?provider=google'
  },
  {
    type: 'password',
    id: 'maishan',
    visualId: 'maishan',
    label: 'Maishan',
    buttonText: '使用 Maishan 登录'
  }
]

function connectorDisplayName(connector: Connector) {
  const rkConnector = connector as RkConnector
  return rkConnector.rkDetails?.name ?? connector.name
}

function connectorIconSource(connector: Connector) {
  return (connector as RkConnector).rkDetails?.iconUrl ?? connector.icon
}

export function LoginPanel() {
  const router = useRouter()
  const [mode, setMode] = useState<'providers' | 'password'>('providers')
  const [walletIcons, setWalletIcons] = useState<Record<string, string>>({})
  const [walletError, setWalletError] = useState<string | null>(null)
  const [walletLoadingId, setWalletLoadingId] = useState<VisualProviderId | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const { address, connector: activeConnector, isConnected } = useAccount()
  const currentChainId = useChainId()
  const { connectors, connectAsync } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { signMessageAsync } = useSignMessage()

  const connectorsByName = useMemo(() => {
    return new Map(connectors.map((connector) => [connectorDisplayName(connector), connector]))
  }, [connectors])

  useEffect(() => {
    let cancelled = false

    async function loadIcons() {
      const walletOptions = visualLoginOptions.filter((option): option is WalletLoginOption & { visualId: VisualProviderId } => option.type === 'wallet')
      const entries = await Promise.all(walletOptions.map(async (option) => {
        const connector = connectorsByName.get(option.connectorName)
        const iconSource = connector ? connectorIconSource(connector) : undefined
        const src = typeof iconSource === 'function' ? await iconSource() : iconSource
        return [option.visualId, src] as const
      }))

      if (!cancelled) {
        setWalletIcons(entries.reduce<Record<string, string>>((icons, [id, src]) => {
          if (src) icons[id] = src
          return icons
        }, {}))
      }
    }

    void loadIcons()
    return () => {
      cancelled = true
    }
  }, [connectorsByName])

  async function finishWalletLogin(addressToSign: string, chainId: number) {
    const nonceRes = await fetch('/api/auth/siwe/nonce')
    if (!nonceRes.ok) throw new Error('无法生成钱包登录 nonce')
    const { nonce } = await nonceRes.json() as { nonce?: string }
    if (!nonce) throw new Error('钱包登录 nonce 无效')

    const message = new SiweMessage({
      domain: window.location.host,
      address: addressToSign,
      statement: '登录 MXStore',
      uri: window.location.origin,
      version: '1',
      chainId,
      nonce
    }).prepareMessage()

    const signature = await signMessageAsync({ message })
    const verifyRes = await fetch('/api/auth/siwe/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, signature })
    })
    if (!verifyRes.ok) throw new Error(await verifyRes.text())
    const data = await verifyRes.json() as { role?: 'admin' | 'user' }
    router.push(data.role === 'admin' ? '/admin' : '/dashboard')
    router.refresh()
  }

  async function loginWithWallet(option: WalletLoginOption & { visualId: VisualProviderId }) {
    const connector = connectorsByName.get(option.connectorName)
    if (!connector) {
      setWalletError(`${option.label} 钱包连接器不可用`)
      return
    }

    setWalletLoadingId(option.visualId)
    setWalletError(null)
    try {
      if (isConnected && activeConnector && activeConnector.uid !== connector.uid) {
        await disconnectAsync()
      }

      if (isConnected && activeConnector?.uid === connector.uid && address) {
        await finishWalletLogin(address, currentChainId)
      } else {
        const result = await connectAsync({ connector })
        await finishWalletLogin(result.accounts[0], result.chainId)
      }
    } catch (error) {
      setWalletError(error instanceof Error ? error.message : '钱包登录失败')
    } finally {
      setWalletLoadingId(null)
    }
  }

  async function loginWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordLoading(true)
    setPasswordError(null)

    const formData = new FormData(event.currentTarget)
    try {
      const response = await fetch('/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(formData.get('email') ?? ''),
          password: String(formData.get('password') ?? '')
        })
      })
      const data = await response.json() as PasswordLoginResponse
      if (!data.ok) throw new Error(data.error)
      if (!response.ok) throw new Error('账户密码登录失败')
      router.push(data.next)
      router.refresh()
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : '账户密码登录失败')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <section className="mx-auto min-h-[844px] w-full max-w-[622px] rounded-[20px] border border-[#d9e0eb] bg-white px-[55px] pb-[31px] pt-[34px] shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
      <div className="mb-[26px] text-center">
        <h1 className="text-[36px] font-semibold leading-[1.2] tracking-normal text-[#071638]">登录 MXStore</h1>
      </div>

      {mode === 'providers' ? (
        <div>
          <div className="space-y-[10px]">
          {visualLoginOptions.map((option) => {
            if (option.type === 'oauth') {
              return (
                <Link key={option.visualId} href={option.href} className="login-provider-button">
                  <ProviderIcon id={option.visualId} />
                  <span className="text-center">{option.buttonText}</span>
                  <span aria-hidden="true" />
                </Link>
              )
            }

            if (option.type === 'password') {
              return (
                <button
                  key={option.visualId}
                  type="button"
                  onClick={() => setMode('password')}
                  className="login-provider-button"
                >
                  <ProviderIcon id={option.visualId} />
                  <span className="text-center">{option.buttonText}</span>
                  <span aria-hidden="true" />
                </button>
              )
            }

            return (
              <button
                key={option.visualId}
                type="button"
                onClick={() => void loginWithWallet(option)}
                disabled={walletLoadingId !== null}
                className="login-provider-button"
              >
                <ProviderIcon id={option.visualId} src={walletIcons[option.visualId]} />
                <span className="text-center">
                  {walletLoadingId === option.visualId ? '等待钱包确认...' : option.buttonText}
                </span>
                <span aria-hidden="true" />
              </button>
            )
          })}
          </div>

          {walletError ? <p className="mt-3 text-center text-sm text-rose-600">{walletError}</p> : null}

          <div className="mt-[22px] grid grid-cols-[1fr_auto_1fr] items-center gap-[24px]">
            <span className="h-px bg-[#dce2ec]" />
            <button type="button" onClick={() => setMode('password')} className="text-[20px] font-normal leading-none tracking-normal text-[#63708a] hover:text-[#071638]">
              使用账户密码登录
            </button>
            <span className="h-px bg-[#dce2ec]" />
          </div>

          <p className="mt-[30px] text-center text-[16px] leading-none tracking-normal text-[#65718a]">
            登录即表示你同意 <Link href="/terms" className="font-medium text-[#0069ff] hover:text-[#0054cc]">《用户协议》</Link>
            <span> 与 </span>
            <Link href="/privacy" className="font-medium text-[#0069ff] hover:text-[#0054cc]">《隐私政策》</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={loginWithPassword} className="space-y-4">
          <label className="block">
            <span className="label">邮箱</span>
            <input name="email" type="email" autoComplete="email" required className="input rounded-xl" />
          </label>
          <label className="block">
            <span className="label">密码</span>
            <input name="password" type="password" autoComplete="current-password" required minLength={8} className="input rounded-xl" />
          </label>

          {passwordError ? <p className="text-sm text-rose-600">{passwordError}</p> : null}

          <button type="submit" disabled={passwordLoading} className="btn w-full rounded-xl">
            {passwordLoading ? '登录中...' : '登录'}
          </button>
          <button
            type="button"
            onClick={() => setMode('providers')}
            className="mx-auto block text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            返回钱包和第三方登录
          </button>
        </form>
      )}
    </section>
  )
}

function ProviderIcon({ id, src }: { id: VisualProviderId; src?: string }) {
  if (src) return <img src={src} alt="" className="h-[34px] w-[34px] rounded-[6px]" aria-hidden="true" />
  if (id === 'tronlink') return <TronLinkIcon />
  if (id === 'binance-wallet') return <BinanceIcon />
  if (id === 'metamask') return <MetaMaskIcon />
  if (id === 'trust-wallet') return <TrustWalletIcon />
  if (id === 'okx-wallet') return <OkxIcon />
  if (id === 'tokenpocket') return <TokenPocketIcon />
  if (id === 'github') return <GitHubIcon />
  if (id === 'google') return <GoogleIcon />
  return <MaishanIcon />
}

function TronLinkIcon() {
  return (
    <svg viewBox="0 0 36 36" className="h-[34px] w-[34px]" aria-hidden="true">
      <rect width="36" height="36" rx="5" fill="#006DFF" />
      <path d="M7.5 6.7 29 11.1 18 29.4 7.5 6.7Z" fill="white" opacity=".96" />
      <path d="M10.7 10.2 23.8 13.1 17.1 24.5 10.7 10.2Z" fill="#006DFF" />
      <path d="M10.7 10.2 17.1 24.5 18.6 16.3l5.2-3.2-13.1-2.9Z" fill="white" opacity=".74" />
      <path d="m18.6 16.3 10.4-5.2L18 29.4l.6-13.1Z" fill="white" opacity=".56" />
    </svg>
  )
}

function BinanceIcon() {
  return (
    <svg viewBox="0 0 36 36" className="h-[34px] w-[34px]" aria-hidden="true">
      <path fill="#F3BA2F" d="m18 2.5 5.2 5.2-5.2 5.2-5.2-5.2L18 2.5Zm-9.1 9.1 5.2 5.2-5.2 5.2-5.2-5.2 5.2-5.2Zm18.2 0 5.2 5.2-5.2 5.2-5.2-5.2 5.2-5.2ZM18 20.7l5.2 5.2-5.2 5.2-5.2-5.2 5.2-5.2Zm0-5.9 3.2 3.2-3.2 3.2-3.2-3.2 3.2-3.2Z" />
    </svg>
  )
}

function MetaMaskIcon() {
  return (
    <svg viewBox="0 0 36 36" className="h-[34px] w-[34px]" aria-hidden="true">
      <path fill="#E17726" d="m5 5 10.2 7.6-1.9-4.5L5 5Zm26 0-8.3 3.1-1.9 4.5L31 5Z" />
      <path fill="#E27625" d="m8.7 24.7-2.6 7.9 9.1-2.5-6.5-5.4Zm18.6 0-6.5 5.4 9.1 2.5-2.6-7.9Z" />
      <path fill="#F6851B" d="m14.7 13.7-1.7 6.4 6-.3 6 .3-1.7-6.4-4.3 2.5-4.3-2.5Z" />
      <path fill="#C0AD9E" d="m15.2 30.1 3.8-1 3.8 1-1-3.2h-5.6l-1 3.2Z" />
      <path fill="#763D16" d="m16.2 24.1-3.9-1.1 2.8 2.5h7.8l2.8-2.5-3.9 1.1-1.3 2.8h-3l-1.3-2.8Z" />
      <path fill="#F6851B" d="m6.1 32.6 2.7-7.9-2.1-6.5L6.1 32.6Zm23.8 0-.6-14.4-2.1 6.5 2.7 7.9Z" />
      <path fill="#E27625" d="m25 20.1-6-.3-6 .3-.7 2.9 3.9 1.1h5.6l3.9-1.1-.7-2.9Z" />
    </svg>
  )
}

function TrustWalletIcon() {
  return (
    <svg viewBox="0 0 36 36" className="h-[34px] w-[34px]" aria-hidden="true">
      <path d="M18 3.6 31 8.9c-.5 10.1-4.4 17.3-13 23.5C9.4 26.2 5.5 19 5 8.9L18 3.6Z" fill="#0C39FF" />
      <path d="M18 7.5 27.4 11c-.8 7.6-3.7 13.2-9.4 17.5C12.3 24.2 9.4 18.6 8.6 11L18 7.5Z" fill="white" />
    </svg>
  )
}

function OkxIcon() {
  return (
    <svg viewBox="0 0 36 36" className="h-[34px] w-[34px]" aria-hidden="true">
      <path d="M3 3h10v10H3V3Zm20 0h10v10H23V3ZM13 13h10v10H13V13ZM3 23h10v10H3V23Zm20 0h10v10H23V23Z" fill="#050505" />
    </svg>
  )
}

function TokenPocketIcon() {
  return (
    <svg viewBox="0 0 56 36" className="h-[34px] w-[44px]" aria-hidden="true">
      <path d="M3 5h27.4c7.4 0 12.1 4.2 12.1 10.4 0 6.4-4.8 10.7-12.1 10.7H22V33H12.8V12.8H3V5Z" fill="#1273E8" />
      <path d="M22 12.6v6.1h7.2c2.4 0 3.9-1.2 3.9-3.1 0-1.8-1.5-3-3.9-3H22Z" fill="white" />
      <path d="M43.2 13c5.7 0 9.8 4.2 9.8 10s-4.1 10-9.8 10h-7.1V13h7.1Zm-1.1 6.9v6.2h1.1c1.9 0 3.2-1.2 3.2-3.1s-1.3-3.1-3.2-3.1h-1.1Z" fill="#1273E8" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 36 36" className="h-[34px] w-[34px]" aria-hidden="true">
      <path
        fill="#050505"
        d="M18 2.5A15.5 15.5 0 0 0 13.1 32.7c.8.1 1.1-.4 1.1-.8v-2.7c-4.3.9-5.2-1.9-5.2-1.9-.7-1.8-1.7-2.2-1.7-2.2-1.4-1 .1-1 .1-1 1.6.1 2.4 1.6 2.4 1.6 1.4 2.4 3.6 1.7 4.5 1.3.1-1 .5-1.7 1-2.1-3.4-.4-7.1-1.7-7.1-7.7 0-1.7.6-3.1 1.6-4.2-.2-.4-.7-2 .2-4.1 0 0 1.3-.4 4.3 1.6a14.7 14.7 0 0 1 7.8 0c3-2 4.3-1.6 4.3-1.6.8 2.1.3 3.7.1 4.1 1 1.1 1.6 2.5 1.6 4.2 0 6-3.7 7.3-7.1 7.7.6.5 1.1 1.5 1.1 2.9v4.1c0 .4.3.9 1.1.8A15.5 15.5 0 0 0 18 2.5Z"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 36 36" className="h-[34px] w-[34px]" aria-hidden="true">
      <path fill="#4285F4" d="M33.8 18.4c0-1.1-.1-2.2-.3-3.2H18.3v6h8.6a7.3 7.3 0 0 1-3.2 4.8v3.9h5.1c3.1-2.8 5-6.9 5-11.5Z" />
      <path fill="#34A853" d="M18.3 34c4.4 0 8.1-1.5 10.8-4l-5.1-3.9c-1.4 1-3.3 1.5-5.6 1.5-4.2 0-7.8-2.9-9.1-6.7H4v4.1A16 16 0 0 0 18.3 34Z" />
      <path fill="#FBBC05" d="M9.2 20.9a9.6 9.6 0 0 1 0-6.2v-4.1H4a16 16 0 0 0 0 14.5l5.2-4.2Z" />
      <path fill="#EA4335" d="M18.3 8c2.4 0 4.5.8 6.2 2.4l4.5-4.5A15.4 15.4 0 0 0 18.3 2 16 16 0 0 0 4 10.6l5.2 4.1C10.5 10.9 14.1 8 18.3 8Z" />
    </svg>
  )
}

function MaishanIcon() {
  return (
    <svg viewBox="0 0 36 36" className="h-[34px] w-[34px]" aria-hidden="true">
      <rect x="1" y="1" width="34" height="34" rx="17" fill="#050505" />
      <path d="M10.5 22.8 16.4 11c.7-1.3 2.5-1.3 3.2 0l5.9 11.8c.7 1.3-.3 2.9-1.8 2.9H12.3c-1.5 0-2.5-1.6-1.8-2.9Z" fill="white" />
    </svg>
  )
}
