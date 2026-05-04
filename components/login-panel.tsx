'use client'

import Link from 'next/link'
import type { Connector } from 'wagmi'
import { SiweMessage } from 'siwe'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useAccount, useChainId, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { loginOptions, walletLoginOptions, type WalletLoginOption } from '@/lib/login-options'
import { AuthProviderIcon } from '@/components/auth-provider-icon'

type RkConnector = Connector & {
  rkDetails?: {
    name?: string
    iconUrl?: string | (() => Promise<string>)
  }
}

type PasswordLoginResponse =
  | { ok: true; next: string }
  | { ok: false; error: string }

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
  const [walletLoadingId, setWalletLoadingId] = useState<string | null>(null)
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
      const entries = await Promise.all(walletLoginOptions.map(async (option) => {
        const connector = connectorsByName.get(option.connectorName)
        const iconSource = connector ? connectorIconSource(connector) : undefined
        const src = typeof iconSource === 'function' ? await iconSource() : iconSource
        return [option.id, src] as const
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

  async function loginWithWallet(option: WalletLoginOption) {
    const connector = connectorsByName.get(option.connectorName)
    if (!connector) {
      setWalletError(`${option.label} 钱包连接器不可用`)
      return
    }

    setWalletLoadingId(option.id)
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
    <section className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 text-center">
        <h1 className="text-xl font-semibold text-slate-900">登录 MXStore</h1>
      </div>

      {mode === 'providers' ? (
        <div className="space-y-3">
          {loginOptions.map((option) => {
            if (option.type === 'oauth') {
              return (
                <Link key={option.id} href={option.href} className="btn-secondary w-full justify-start gap-3 rounded-xl">
                  <AuthProviderIcon id={option.id} label={option.label} />
                  <span className="flex-1 text-center">{option.buttonText}</span>
                </Link>
              )
            }

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => void loginWithWallet(option)}
                disabled={walletLoadingId !== null}
                className="btn-secondary w-full justify-start gap-3 rounded-xl"
              >
                <AuthProviderIcon id={option.id} label={option.label} src={walletIcons[option.id]} />
                <span className="flex-1 text-center">
                  {walletLoadingId === option.id ? '等待钱包确认...' : option.buttonText}
                </span>
              </button>
            )
          })}

          {walletError ? <p className="text-sm text-rose-600">{walletError}</p> : null}

          <button
            type="button"
            onClick={() => setMode('password')}
            className="mx-auto block pt-2 text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            使用账户密码登录
          </button>
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
            className="mx-auto block text-xs font-medium text-slate-500 hover:text-slate-900"
          >
            返回钱包和第三方登录
          </button>
        </form>
      )}
    </section>
  )
}
