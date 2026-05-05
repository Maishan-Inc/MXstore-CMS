'use client'

import { useState } from 'react'
import {
  Bot,
  Box,
  Brain,
  Code2,
  Database,
  Download,
  FileText,
  Globe2,
  Image,
  KeyRound,
  Layers,
  Link2,
  Lock,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
  X,
  type LucideIcon
} from 'lucide-react'

const iconLibrary: Record<string, LucideIcon> = {
  Bot,
  Box,
  Brain,
  Code2,
  Database,
  Download,
  FileText,
  Globe2,
  Image,
  KeyRound,
  Layers,
  Link2,
  Lock,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap
}

type CategoryItem = {
  id?: string
  name: string
  slug: string
  icon: string
  sort_order: number
  enabled: boolean
}

type BannerItem = {
  id?: string
  title: string
  subtitle: string | null
  image_url: string | null
  cta_label: string | null
  cta_href: string | null
  sort_order: number
  enabled: boolean
}

type LoginProviderItem = {
  id: string
  provider_type: 'wallet' | 'oauth' | 'password'
  label: string
  button_text: string
  provider: string | null
  connector_name: string | null
  icon_url: string | null
  sort_order: number
  enabled: boolean
}

function loginProviderTypeLabel(type: LoginProviderItem['provider_type']) {
  if (type === 'wallet') return '加密货币钱包'
  if (type === 'oauth') return 'GitHub / Google OAuth'
  return '账户密码'
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })
}

function IconPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const SelectedIcon = iconLibrary[value] ?? Box

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} className="btn-secondary w-full justify-start gap-2">
        <SelectedIcon className="h-4 w-4" />
        {value}
      </button>
      {open ? (
        <div className="absolute left-0 top-12 z-30 grid w-[320px] grid-cols-5 gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          {Object.entries(iconLibrary).map(([name, Icon]) => (
            <button
              key={name}
              type="button"
              title={name}
              onClick={() => {
                onChange(name)
                setOpen(false)
              }}
              className={name === value
                ? 'flex h-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600'
                : 'flex h-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-50'}
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function CategoryManager({ initialItems }: { initialItems: CategoryItem[] }) {
  const [items, setItems] = useState<CategoryItem[]>(initialItems)
  const [draft, setDraft] = useState<CategoryItem>({ name: '', slug: '', icon: 'Box', sort_order: 0, enabled: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save(item: CategoryItem) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/categories', {
        method: item.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })
      if (!res.ok) throw new Error(await res.text())
      location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card grid gap-4 md:grid-cols-[1fr_1fr_180px_120px_auto]">
        <input className="input" placeholder="分类名称" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input className="input" placeholder="slug，例如 ai-apps" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
        <IconPicker value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} />
        <input className="input" type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
        <button disabled={saving} onClick={() => void save(draft)} className="btn">新增分类</button>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="grid gap-4">
        {items.map((item, index) => {
          const Icon = iconLibrary[item.icon] ?? Box
          return (
            <div key={item.id ?? index} className="card grid gap-4 md:grid-cols-[52px_1fr_1fr_180px_120px_110px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-5 w-5" /></div>
              <input className="input" value={item.name} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, name: e.target.value } : entry))} />
              <input className="input" value={item.slug} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, slug: e.target.value } : entry))} />
              <IconPicker value={item.icon} onChange={(icon) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, icon } : entry))} />
              <input className="input" type="number" value={item.sort_order} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, sort_order: Number(e.target.value) } : entry))} />
              <button disabled={saving} onClick={() => void save(item)} className="btn-secondary">保存</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function BannerManager({ initialItems }: { initialItems: BannerItem[] }) {
  const empty: BannerItem = { title: '', subtitle: '', image_url: '', cta_label: '查看详情', cta_href: '/', sort_order: 0, enabled: true }
  const [items, setItems] = useState<BannerItem[]>(initialItems)
  const [draft, setDraft] = useState<BannerItem>(empty)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File, apply: (url: string) => void) {
    apply(await readImageAsDataUrl(file))
  }

  async function save(item: BannerItem) {
    setError(null)
    const res = await fetch('/api/admin/banners', {
      method: item.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    if (!res.ok) {
      setError(await res.text())
      return
    }
    location.reload()
  }

  return (
    <div className="space-y-6">
      <div className="card grid gap-4 lg:grid-cols-2">
        <input className="input" placeholder="标题" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <input className="input" placeholder="副标题" value={draft.subtitle ?? ''} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
        <input className="input" placeholder="跳转按钮文字" value={draft.cta_label ?? ''} onChange={(e) => setDraft({ ...draft, cta_label: e.target.value })} />
        <input className="input" placeholder="跳转链接" value={draft.cta_href ?? ''} onChange={(e) => setDraft({ ...draft, cta_href: e.target.value })} />
        <input className="input" placeholder="图片 URL 或上传图片" value={draft.image_url ?? ''} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} />
        <input className="input" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] ? void upload(e.target.files[0], (url) => setDraft({ ...draft, image_url: url })) : undefined} />
        <button onClick={() => void save(draft)} className="btn lg:w-fit">新增轮播图</button>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="grid gap-4">
        {items.map((item, index) => (
          <div key={item.id ?? index} className="card grid gap-4 lg:grid-cols-[160px_1fr_auto]">
            <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
              {item.image_url ? <img src={item.image_url} alt="" className="h-full w-full object-cover" /> : <Image className="h-8 w-8" />}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input" value={item.title} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, title: e.target.value } : entry))} />
              <input className="input" value={item.subtitle ?? ''} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, subtitle: e.target.value } : entry))} />
              <input className="input" value={item.cta_label ?? ''} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, cta_label: e.target.value } : entry))} />
              <input className="input" value={item.cta_href ?? ''} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, cta_href: e.target.value } : entry))} />
              <input className="input md:col-span-2" value={item.image_url ?? ''} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, image_url: e.target.value } : entry))} />
            </div>
            <button onClick={() => void save(item)} className="btn-secondary h-fit">保存</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LoginProviderManager({ initialItems }: { initialItems: LoginProviderItem[] }) {
  const empty: LoginProviderItem = { id: '', provider_type: 'oauth', label: '', button_text: '', provider: '', connector_name: '', icon_url: '', sort_order: 0, enabled: true }
  const [items, setItems] = useState<LoginProviderItem[]>(initialItems)
  const [draft, setDraft] = useState<LoginProviderItem>(empty)
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File, apply: (url: string) => void) {
    apply(await readImageAsDataUrl(file))
  }

  async function save(item: LoginProviderItem) {
    setError(null)
    const res = await fetch('/api/admin/login-providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })
    if (!res.ok) {
      setError(await res.text())
      return
    }
    location.reload()
  }

  function openCreate() {
    setDraft(empty)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(item: LoginProviderItem) {
    setDraft({ ...item })
    setError(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">第三方登录</h1>
          <p className="mt-2 text-sm text-slate-500">配置快捷登录方式、按钮文字、连接器名称和图标。OAuth 的实现仍需在 Supabase 控制台启用。</p>
        </div>
        <button type="button" onClick={openCreate} className="btn shrink-0">新增第三方登录</button>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">图标</th>
                <th className="px-5 py-3 font-medium">名称</th>
                <th className="px-5 py-3 font-medium">类型</th>
                <th className="px-5 py-3 font-medium">按钮文字</th>
                <th className="px-5 py-3 font-medium">Provider / Connector</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-5 py-4">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                      {item.icon_url ? <img src={item.icon_url} alt="" className="h-full w-full object-cover" /> : <KeyRound className="h-5 w-5 text-slate-500" />}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.id}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className={item.provider_type === 'wallet'
                      ? 'rounded-md bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700'
                      : item.provider_type === 'oauth'
                        ? 'rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700'
                        : 'rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600'}
                    >
                      {loginProviderTypeLabel(item.provider_type)}
                    </span>
                  </td>
                  <td className="px-5 py-4">{item.button_text}</td>
                  <td className="px-5 py-4 text-slate-500">
                    {item.provider_type === 'wallet' ? item.connector_name || '-' : item.provider_type === 'oauth' ? item.provider || '-' : '-'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={item.enabled ? 'rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700' : 'rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600'}>
                      {item.enabled ? '已启用' : '已停用'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button type="button" onClick={() => openEdit(item)} className="btn-secondary">修改</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!items.length ? <p className="px-5 py-8 text-sm text-slate-500">暂无登录方式。</p> : null}
      </div>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4 py-8">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">{draft.id ? '修改第三方登录' : '新增第三方登录'}</h2>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <label>
                <span className="label">ID</span>
                <input className="input" placeholder="例如 google" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
              </label>
              <label>
                <span className="label">类型</span>
                <select className="input" value={draft.provider_type} onChange={(e) => setDraft({ ...draft, provider_type: e.target.value as LoginProviderItem['provider_type'] })}>
                  <option value="oauth">GitHub / Google OAuth</option>
                  <option value="wallet">加密货币钱包</option>
                  <option value="password">账户密码</option>
                </select>
              </label>
              <label>
                <span className="label">显示名称</span>
                <input className="input" placeholder="Google" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
              </label>
              <label>
                <span className="label">按钮文字</span>
                <input className="input" placeholder="使用 Google 登录" value={draft.button_text} onChange={(e) => setDraft({ ...draft, button_text: e.target.value })} />
              </label>
              {draft.provider_type === 'oauth' ? (
                <label className="md:col-span-2">
                  <span className="label">OAuth Provider</span>
                  <input className="input" placeholder="google 或 github，必须和 Supabase 控制台启用的 Provider 一致" value={draft.provider ?? ''} onChange={(e) => setDraft({ ...draft, provider: e.target.value, connector_name: '' })} />
                  <span className="mt-2 block text-xs text-slate-500">GitHub / Google 属于 Supabase OAuth 登录，需要在 Supabase Authentication Providers 中启用并配置回调地址。</span>
                </label>
              ) : null}
              {draft.provider_type === 'wallet' ? (
                <label className="md:col-span-2">
                  <span className="label">钱包连接器名称</span>
                  <input className="input" placeholder="MetaMask / WalletConnect / OKX Wallet" value={draft.connector_name ?? ''} onChange={(e) => setDraft({ ...draft, connector_name: e.target.value, provider: '' })} />
                  <span className="mt-2 block text-xs text-slate-500">加密货币钱包使用 RainbowKit / wagmi 连接器和 SIWE 签名登录，不需要 Supabase OAuth Provider。</span>
                </label>
              ) : null}
              {draft.provider_type === 'password' ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 md:col-span-2">
                  账户密码登录使用 Supabase Email Password Auth，不需要 OAuth Provider 或钱包连接器。
                </div>
              ) : null}
              <label className="md:col-span-2">
                <span className="label">图标 URL</span>
                <input className="input" placeholder="https://..." value={draft.icon_url ?? ''} onChange={(e) => setDraft({ ...draft, icon_url: e.target.value })} />
              </label>
              <label>
                <span className="label">上传图标</span>
                <input className="input" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] ? void upload(e.target.files[0], (url) => setDraft({ ...draft, icon_url: url })) : undefined} />
              </label>
              <label>
                <span className="label">排序</span>
                <input className="input" type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
                启用该登录方式
              </label>
              {draft.icon_url ? (
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                    <img src={draft.icon_url} alt="" className="h-full w-full object-cover" />
                  </div>
                  <span className="text-sm text-slate-500">图标预览</span>
                </div>
              ) : null}
            </div>
            {error ? <p className="mx-6 mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">取消</button>
              <button type="button" onClick={() => void save(draft)} className="btn">保存</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
