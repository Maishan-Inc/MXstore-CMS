'use client'

import { useState } from 'react'
import { useAccount, useSendTransaction, usePublicClient } from 'wagmi'

export function AppPurchaseButton({ appId, payToAddress, amountRaw, chainId }: {
  appId: string
  payToAddress: string
  amountRaw: string
  chainId: number
}) {
  const { isConnected } = useAccount()
  const { sendTransactionAsync } = useSendTransaction()
  const publicClient = usePublicClient({ chainId })
  const [txHash, setTxHash] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function verify(hash: string) {
    const res = await fetch('/api/payments/evm/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: appId, tx_hash: hash })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  async function pay() {
    setLoading(true)
    setMessage(null)
    try {
      if (!publicClient) throw new Error('当前钱包网络不支持')
      const hash = await sendTransactionAsync({
        to: payToAddress as `0x${string}`,
        value: BigInt(amountRaw),
        chainId
      })
      setTxHash(hash)
      await publicClient.waitForTransactionReceipt({ hash })
      await verify(hash)
      setMessage('购买成功！请刷新页面后下载。')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '付款失败')
    } finally {
      setLoading(false)
    }
  }

  async function verifyManual() {
    setLoading(true)
    setMessage(null)
    try {
      await verify(txHash)
      setMessage('购买成功！请刷新页面后下载。')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '校验失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {isConnected ? (
        <button disabled={loading} onClick={pay} className="btn w-full">
          {loading ? '处理中...' : '钱包付款购买'}
        </button>
      ) : (
        <p className="text-sm text-slate-500">请先连接钱包</p>
      )}
      <div className="space-y-2">
        <input className="input" placeholder="或手动粘贴 txHash" value={txHash} onChange={(e) => setTxHash(e.target.value)} />
        <button disabled={!txHash || loading} onClick={verifyManual} className="btn-secondary w-full">校验 txHash</button>
      </div>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  )
}
