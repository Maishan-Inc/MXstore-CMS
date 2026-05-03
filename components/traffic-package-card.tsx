'use client'

import { useState } from 'react'
import { useAccount, usePublicClient, useSendTransaction } from 'wagmi'
import { formatBytes } from '@/lib/format'

type Package = {
  id: string
  name: string
  bytes_amount: number | string
  chain_id: number
  asset_type: 'native' | 'erc20'
  token_symbol: string | null
  amount_raw: string
  pay_to_address: string
}

export function TrafficPackageCard({ pkg }: { pkg: Package }) {
  const { isConnected } = useAccount()
  const { sendTransactionAsync } = useSendTransaction()
  const publicClient = usePublicClient({ chainId: pkg.chain_id })
  const [txHash, setTxHash] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function verify(hash: string) {
    const res = await fetch('/api/payments/evm/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package_id: pkg.id, tx_hash: hash })
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  async function payNative() {
    setLoading(true)
    setMessage(null)
    try {
      if (!publicClient) throw new Error('当前钱包网络不支持或 RPC 未配置')
      const hash = await sendTransactionAsync({
        to: pkg.pay_to_address as `0x${string}`,
        value: BigInt(pkg.amount_raw),
        chainId: pkg.chain_id
      })
      setTxHash(hash)
      await publicClient.waitForTransactionReceipt({ hash })
      await verify(hash)
      setMessage('付款确认成功，流量已到账')
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
      setMessage('校验成功，流量已到账')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '校验失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">{pkg.name}</h2>
      <p className="text-3xl font-semibold text-slate-900">{formatBytes(Number(pkg.bytes_amount))}</p>
      <p className="text-sm text-slate-500">链：{pkg.chain_id} · {pkg.asset_type === 'native' ? '原生币' : pkg.token_symbol}</p>
      <p className="break-all text-xs text-slate-500">收款地址：{pkg.pay_to_address}</p>
      {pkg.asset_type === 'native' ? (
        <button disabled={!isConnected || loading} onClick={payNative} className="btn w-full">
          {loading ? '处理中...' : '钱包付款并自动校验'}
        </button>
      ) : (
        <p className="text-xs text-slate-500">ERC20 前端付款按钮可继续接入 wagmi writeContract；后端校验已支持 Transfer 事件。</p>
      )}
      <div className="space-y-2">
        <input className="input" placeholder="也可以手动粘贴 txHash 后校验" value={txHash} onChange={(e) => setTxHash(e.target.value)} />
        <button disabled={!txHash || loading} onClick={verifyManual} className="btn-secondary w-full">校验 txHash</button>
      </div>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  )
}
