'use client'

import { useState } from 'react'

export function OrderActions({ paymentId, status }: { paymentId: string; status: string }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [showReject, setShowReject] = useState(false)

  async function confirm() {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/confirm`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      setMessage('已确认')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  async function reject() {
    if (!reason.trim()) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      if (!res.ok) throw new Error(await res.text())
      setMessage('已拒绝')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  if (status !== 'pending') return message ? <p className="text-xs text-slate-500">{message}</p> : null

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button disabled={loading} onClick={confirm} className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">确认</button>
        <button disabled={loading} onClick={() => setShowReject(!showReject)} className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50">拒绝</button>
      </div>
      {showReject && (
        <div className="flex gap-2">
          <input className="input flex-1 text-xs" placeholder="拒绝原因" value={reason} onChange={(e) => setReason(e.target.value)} />
          <button disabled={loading || !reason.trim()} onClick={reject} className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50">提交</button>
        </div>
      )}
      {message && !showReject ? <p className="text-xs text-slate-500">{message}</p> : null}
    </div>
  )
}
