'use client'

import { useState } from 'react'

export function DownloadButton({ linkId, label }: { linkId: string; label: string }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function download() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/download/${linkId}`, { method: 'GET', redirect: 'manual' })
      if (res.type === 'opaqueredirect' || res.status === 0) {
        window.location.href = `/api/download/${linkId}`
        return
      }
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get('Location')
        if (location) window.location.href = location
        return
      }
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      window.location.href = data.url
    } catch (e) {
      setError(e instanceof Error ? e.message : '无法下载')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={download} disabled={loading} className="btn">
        {loading ? '准备下载...' : label}
      </button>
      {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
    </div>
  )
}
