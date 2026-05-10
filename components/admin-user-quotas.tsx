'use client'

import { useState } from 'react'
import { finishActionFeedback, startActionFeedback } from '@/components/action-feedback'

type Props = {
  userId: string
  downloadQuotaBytes: number
  distributionQuotaBytes: number
  distributionChargeThresholdBytes: number
}

export function AdminUserQuotas({ userId, downloadQuotaBytes, distributionQuotaBytes, distributionChargeThresholdBytes }: Props) {
  const [downloadQuota, setDownloadQuota] = useState(String(downloadQuotaBytes))
  const [distributionQuota, setDistributionQuota] = useState(String(distributionQuotaBytes))
  const [distributionThreshold, setDistributionThreshold] = useState(String(distributionChargeThresholdBytes))
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function save() {
    setLoading(true)
    setMessage(null)
    startActionFeedback()
    try {
      const res = await fetch(`/api/admin/users/${userId}/quota`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          download_quota_bytes: Number(downloadQuota),
          distribution_quota_bytes: Number(distributionQuota),
          distribution_charge_threshold_bytes: Number(distributionThreshold)
        })
      })
      if (!res.ok) throw new Error(await res.text())
      setMessage('已保存')
      finishActionFeedback('用户配额保存成功')
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败'
      setMessage(message)
      finishActionFeedback(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-2">
      <div className="grid gap-2 lg:grid-cols-3">
        <label>
          <span className="label">下载流量</span>
          <input value={downloadQuota} onChange={(e) => setDownloadQuota(e.target.value)} className="input" type="number" min="0" />
        </label>
        <label>
          <span className="label">分发流量</span>
          <input value={distributionQuota} onChange={(e) => setDistributionQuota(e.target.value)} className="input" type="number" min="0" />
        </label>
        <label>
          <span className="label">分发扣费阈值</span>
          <input value={distributionThreshold} onChange={(e) => setDistributionThreshold(e.target.value)} className="input" type="number" min="0" />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => void save()} disabled={loading} className="btn-secondary">
          {loading ? '保存中...' : '保存配额'}
        </button>
        {message ? <span className="text-xs text-slate-500">{message}</span> : null}
      </div>
    </div>
  )
}
