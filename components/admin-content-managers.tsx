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

  return (
    <div className="space-y-6">
      <div className="card grid gap-4 lg:grid-cols-3">
        <input className="input" placeholder="ID，例如 google" value={draft.id} onChange={(e) => setDraft({ ...draft, id: e.target.value })} />
        <select className="input" value={draft.provider_type} onChange={(e) => setDraft({ ...draft, provider_type: e.target.value as LoginProviderItem['provider_type'] })}>
          <option value="oauth">OAuth</option>
          <option value="wallet">钱包</option>
          <option value="password">密码</option>
        </select>
        <input className="input" placeholder="显示名称" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        <input className="input" placeholder="按钮文字" value={draft.button_text} onChange={(e) => setDraft({ ...draft, button_text: e.target.value })} />
        <input className="input" placeholder="OAuth provider，例如 google" value={draft.provider ?? ''} onChange={(e) => setDraft({ ...draft, provider: e.target.value })} />
        <input className="input" placeholder="钱包连接器名称，例如 MetaMask" value={draft.connector_name ?? ''} onChange={(e) => setDraft({ ...draft, connector_name: e.target.value })} />
        <input className="input" placeholder="图标 URL 或上传图片" value={draft.icon_url ?? ''} onChange={(e) => setDraft({ ...draft, icon_url: e.target.value })} />
        <input className="input" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] ? void upload(e.target.files[0], (url) => setDraft({ ...draft, icon_url: url })) : undefined} />
        <button onClick={() => void save(draft)} className="btn">保存登录方式</button>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="grid gap-4">
        {items.map((item, index) => (
          <div key={item.id} className="card grid gap-4 xl:grid-cols-[56px_130px_120px_1fr_1fr_1fr_100px]">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
              {item.icon_url ? <img src={item.icon_url} alt="" className="h-full w-full object-cover" /> : <KeyRound className="h-5 w-5 text-slate-500" />}
            </div>
            <input className="input" value={item.id} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, id: e.target.value } : entry))} />
            <select className="input" value={item.provider_type} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, provider_type: e.target.value as LoginProviderItem['provider_type'] } : entry))}>
              <option value="oauth">OAuth</option>
              <option value="wallet">钱包</option>
              <option value="password">密码</option>
            </select>
            <input className="input" value={item.label} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, label: e.target.value } : entry))} />
            <input className="input" value={item.button_text} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, button_text: e.target.value } : entry))} />
            <input className="input" value={item.icon_url ?? ''} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, icon_url: e.target.value } : entry))} />
            <button onClick={() => void save(item)} className="btn-secondary">保存</button>
          </div>
        ))}
      </div>
    </div>
  )
}
