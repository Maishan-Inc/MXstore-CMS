'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { useAccount, usePublicClient, useSendTransaction } from 'wagmi'
import { formatBytes } from '@/lib/format'

type Package = {
  id: string
  name: string
  description?: string | null
  badge?: string | null
  display_price?: string | null
  traffic_label?: string | null
  cta_label?: string | null
  features?: string[] | null
  highlighted?: boolean | null
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
    <div
      className={`flex h-full flex-col rounded-[28px] border bg-white p-6 shadow-[rgba(14,15,12,0.12)_0_0_0_1px] transition duration-200 hover:-translate-y-1 hover:border-[#9fe870] ${
        pkg.highlighted ? 'border-[#9fe870] ring-1 ring-[#9fe870]' : 'border-[#0e0f0c]/10'
      }`}
    >
      <div className="flex min-h-16 items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-[#0e0f0c]">{pkg.name}</h2>
          <p className="mt-1 text-sm leading-6 text-[#868685]">{pkg.description || '链上付款确认后自动增加账户下载流量。'}</p>
        </div>
        {pkg.badge ? <span className="rounded-full bg-[#e2f6d5] px-3 py-1 text-xs font-black text-[#163300]">{pkg.badge}</span> : null}
      </div>

      <div className="mt-6">
        <p className="text-4xl font-black text-[#0e0f0c]">{pkg.display_price || '链上付款'}</p>
        <p className="mt-2 text-sm font-semibold text-[#454745]">{pkg.traffic_label || formatBytes(Number(pkg.bytes_amount))}</p>
      </div>

      <ul className="mt-6 flex-1 space-y-3 text-sm leading-6 text-[#454745]">
        {(pkg.features?.length ? pkg.features : ['链上交易自动校验', '确认后流量自动到账', '支持手动粘贴 txHash 校验']).map((feature) => (
          <li key={feature} className="flex gap-3">
            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#9fe870] text-[#163300]">
              <Check className="h-3.5 w-3.5" />
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-sm text-[#868685]">链：{pkg.chain_id} · {pkg.asset_type === 'native' ? '原生币' : pkg.token_symbol}</p>
      <p className="mt-2 break-all text-xs text-[#868685]">收款地址：{pkg.pay_to_address}</p>
      {pkg.asset_type === 'native' ? (
        <button disabled={!isConnected || loading} onClick={payNative} className="btn mt-5 w-full">
          {loading ? '处理中...' : pkg.cta_label || '钱包付款并自动校验'}
        </button>
      ) : (
        <p className="mt-5 text-xs text-[#868685]">ERC20 前端付款按钮可继续接入 wagmi writeContract；后端校验已支持 Transfer 事件。</p>
      )}
      <div className="mt-3 space-y-2">
        <input className="input" placeholder="也可以手动粘贴 txHash 后校验" value={txHash} onChange={(e) => setTxHash(e.target.value)} />
        <button disabled={!txHash || loading} onClick={verifyManual} className="btn-secondary w-full">校验 txHash</button>
      </div>
      {message ? <p className="mt-3 text-sm text-[#454745]">{message}</p> : null}
    </div>
  )
}
