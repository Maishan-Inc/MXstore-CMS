'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { appFormDefaults, type AdminAppFormValues, type AdminAppLinkInput } from '@/lib/admin/apps'

type AdminAppFormProps = {
  mode?: 'create' | 'edit'
  appId?: string
  initialValues?: AdminAppFormValues
}

function makeNewLink(index: number): AdminAppLinkInput {
  return {
    id: null,
    name: `下载 ${index + 1}`,
    input_url: '',
    file_size_bytes: '',
    charge_traffic: true,
    sort_order: index
  }
}

export function AdminAppForm({ mode = 'create', appId, initialValues }: AdminAppFormProps) {
  const router = useRouter()
  const defaults = useMemo(() => initialValues ?? appFormDefaults(), [initialValues])
  const [links, setLinks] = useState<AdminAppLinkInput[]>(defaults.links)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateLink(index: number, patch: Partial<AdminAppLinkInput>) {
    setLinks((current) => current.map((link, i) => (i === index ? { ...link, ...patch, sort_order: i } : link)))
  }

  function removeLink(index: number) {
    setLinks((current) => current.filter((_, i) => i !== index).map((link, i) => ({ ...link, sort_order: i })))
  }

  async function submit(formData: FormData) {
    setLoading(true)
    setError(null)
    const payload = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      version: formData.get('version'),
      platform: formData.get('platform'),
      logo_url: formData.get('logo_url'),
      is_paid: formData.get('is_paid') === 'on',
      price_cents: Number(formData.get('price_cents') || 0),
      currency: String(formData.get('currency') || 'USD'),
      published: formData.get('published') === 'on',
      links: links.map((link, index) => ({
        id: link.id,
        name: link.name || `下载 ${index + 1}`,
        input_url: link.input_url,
        file_size_bytes: link.file_size_bytes ? Number(link.file_size_bytes) : null,
        charge_traffic: link.charge_traffic,
        sort_order: index
      }))
    }

    try {
      const res = await fetch(mode === 'create' ? '/api/admin/apps' : `/api/admin/apps?id=${appId}`, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      router.push(`/admin/apps/${data.id}/edit`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : mode === 'create' ? '创建失败' : '保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={submit} className="space-y-6">
      <div className="card grid gap-4 md:grid-cols-2">
        <label>
          <span className="label">应用名称</span>
          <input name="name" defaultValue={defaults.name} className="input" required placeholder="罗小黑战记" />
        </label>
        <label>
          <span className="label">Slug</span>
          <input name="slug" defaultValue={defaults.slug} className="input" required placeholder="luoxiaohei" />
        </label>
        <label>
          <span className="label">版本</span>
          <input name="version" defaultValue={defaults.version} className="input" placeholder="2025.2160p" />
        </label>
        <label>
          <span className="label">平台/分类</span>
          <input name="platform" defaultValue={defaults.platform} className="input" placeholder="Windows / macOS / Android / Video" />
        </label>
        <label>
          <span className="label">Logo URL</span>
          <input name="logo_url" defaultValue={defaults.logo_url} className="input" placeholder="https://..." />
        </label>
        <label>
          <span className="label">货币</span>
          <input name="currency" defaultValue={defaults.currency} className="input" />
        </label>
        <label className="md:col-span-2">
          <span className="label">描述</span>
          <textarea name="description" defaultValue={defaults.description} className="input min-h-28" placeholder="应用介绍、更新日志、安装说明" />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input name="is_paid" type="checkbox" defaultChecked={defaults.is_paid} /> 下载前需要购买/授权
        </label>
        <label>
          <span className="label">价格，单位：分</span>
          <input name="price_cents" type="number" min="0" defaultValue={defaults.price_cents} className="input" />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input name="published" type="checkbox" defaultChecked={defaults.published} /> 立即发布
        </label>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">下载链接</h2>
            <p className="mt-1 text-sm text-slate-500">支持 OpenList /p 链接与外部官网链接，系统会自动识别并匹配 Token。</p>
          </div>
          <button type="button" onClick={() => setLinks((value) => [...value, makeNewLink(value.length)])} className="btn-secondary">
            添加链接
          </button>
        </div>
        {links.map((link, index) => (
          <div key={link.id ?? index} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-4">
            <label>
              <span className="label">链接名称</span>
              <input className="input" value={link.name} onChange={(e) => updateLink(index, { name: e.target.value })} />
            </label>
            <label className="md:col-span-2">
              <span className="label">URL</span>
              <input className="input" value={link.input_url} onChange={(e) => updateLink(index, { input_url: e.target.value })} required />
            </label>
            <label>
              <span className="label">文件大小 bytes</span>
              <input className="input" type="number" value={link.file_size_bytes} onChange={(e) => updateLink(index, { file_size_bytes: e.target.value })} />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={link.charge_traffic} onChange={(e) => updateLink(index, { charge_traffic: e.target.checked })} /> 扣用户流量
            </label>
            <div className="flex items-center justify-between md:col-span-3">
              <span className="text-xs text-slate-400">排序：{index + 1}</span>
              <button type="button" onClick={() => removeLink(index)} disabled={links.length === 1} className="btn-secondary md:w-fit">
                删除
              </button>
            </div>
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <button disabled={loading} className="btn">
        {loading ? (mode === 'create' ? '创建中...' : '保存中...') : mode === 'create' ? '创建应用' : '保存应用'}
      </button>
    </form>
  )
}
