'use client'

import { useState } from 'react'
import { DatabaseZap } from 'lucide-react'
import { finishActionFeedback, startActionFeedback } from '@/components/action-feedback'

type UpdateResult = {
  ok: true
  applied: string[]
  skipped: string[]
}

export function DatabaseUpdateButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function updateDatabase() {
    setLoading(true)
    setMessage(null)
    setError(null)
    startActionFeedback()
    try {
      const response = await fetch('/api/admin/database-update', { method: 'POST' })
      if (!response.ok) throw new Error(await response.text())
      const result = await response.json() as UpdateResult
      const applied = result.applied.length ? result.applied.join('、') : '无'
      const skipped = result.skipped.length ? result.skipped.length : 0
      setMessage(`更新完成。已执行：${applied}；已跳过：${skipped} 个。`)
      finishActionFeedback('数据库更新完成')
    } catch (err) {
      const message = err instanceof Error ? err.message : '数据库更新失败'
      setError(message)
      finishActionFeedback(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">数据库更新</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            点击后执行未应用的 Supabase 迁移，用于版本升级后补齐新表和字段。需要配置 SUPABASE_DB_URL。
          </p>
        </div>
        <button type="button" onClick={() => void updateDatabase()} disabled={loading} className="btn shrink-0 gap-2">
          <DatabaseZap className="h-4 w-4" />
          {loading ? '更新中...' : '立即更新'}
        </button>
      </div>
      {message ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
    </div>
  )
}
