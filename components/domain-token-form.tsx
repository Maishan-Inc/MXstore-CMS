'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { domainFormDefaults, type DomainFormValues } from '@/lib/admin/domain-records'

type DomainTokenFormProps = {
  mode?: 'create' | 'edit'
  domainId?: string
  initialValues?: DomainFormValues
}

export function DomainTokenForm({ mode = 'create', domainId, initialValues }: DomainTokenFormProps) {
  const router = useRouter()
  const defaults = useMemo(() => initialValues ?? domainFormDefaults(), [initialValues])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(formData: FormData) {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        domain: formData.get('domain'),
        openlist_base_url: formData.get('openlist_base_url'),
        admin_token: formData.get('admin_token'),
        sign_ttl_seconds: Number(formData.get('sign_ttl_seconds') || 300),
        enabled: formData.get('enabled') === 'on'
      }
      const res = await fetch(mode === 'create' ? '/api/admin/domains' : `/api/admin/domains?id=${domainId}`, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(await res.text())
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={submit} className="grid gap-4 md:grid-cols-2">
      <label>
        <span className="label">匹配域名</span>
        <input name="domain" defaultValue={defaults.domain} className="input" required placeholder="oss-us-hk.smvapi.store" />
      </label>
      <label>
        <span className="label">OpenList Base URL</span>
        <input name="openlist_base_url" defaultValue={defaults.openlist_base_url} className="input" required placeholder="https://oss-us-hk.smvapi.store" />
      </label>
      <label>
        <span className="label">管理员 Token</span>
        <input name="admin_token" className="input" type="password" placeholder={mode === 'create' ? 'OpenList 管理员 Token' : '留空则保持原 Token'} />
      </label>
      <label>
        <span className="label">签名有效期/秒</span>
        <input name="sign_ttl_seconds" defaultValue={defaults.sign_ttl_seconds} className="input" type="number" min="30" />
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
        <input name="enabled" type="checkbox" defaultChecked={defaults.enabled} /> 启用此域名配置
      </label>
      <div className="md:col-span-2">
        <button disabled={loading} className="btn">
          {loading ? '保存中...' : mode === 'create' ? '保存域名 Token' : '保存域名配置'}
        </button>
        {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
      </div>
    </form>
  )
}
