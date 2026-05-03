'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { SiweMessage } from 'siwe'
import { useAccount, useChainId, useSignMessage } from 'wagmi'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function WalletLogin() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { signMessageAsync } = useSignMessage()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function login() {
    if (!address) return
    setLoading(true)
    setError(null)
    try {
      const nonceRes = await fetch('/api/auth/siwe/nonce')
      const { nonce } = await nonceRes.json()
      const message = new SiweMessage({
        domain: window.location.host,
        address,
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
      const data = await verifyRes.json()
      router.push(data.role === 'admin' ? '/admin' : '/dashboard')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '钱包登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <ConnectButton />
      {isConnected ? (
        <button onClick={login} disabled={loading} className="btn w-full">
          {loading ? '签名中...' : '使用钱包签名登录'}
        </button>
      ) : null}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  )
}
