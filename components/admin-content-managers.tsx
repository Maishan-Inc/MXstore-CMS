'use client'

import { useState } from 'react'
import {
  Image,
  KeyRound,
  X,
  Trash2
} from 'lucide-react'
import { signedImageSrc } from '@/lib/openlist-image'
import { finishActionFeedback, persistActionSuccess, startActionFeedback } from '@/components/action-feedback'
import { categoryIconLibrary, categoryIconNames, getCategoryIcon } from '@/lib/category-icons'

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
  image_openlist_domain: string | null
  cta_label: string | null
  cta_href: string | null
  placement: 'recommended' | 'category'
  category_id: string | null
  app_id: string | null
  sort_order: number
  enabled: boolean
}

type BannerAppOption = {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

type BannerCategoryOption = {
  id: string
  name: string
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
  const [query, setQuery] = useState('')
  const SelectedIcon = getCategoryIcon(value)
  const filteredIcons = categoryIconNames.filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()))

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} className="btn-secondary w-full justify-start gap-2">
        <SelectedIcon className="h-4 w-4" />
        {value}
      </button>
      {open ? (
        <div className="absolute left-0 top-12 z-30 w-[min(420px,calc(100vw-3rem))] rounded-[24px] border border-[#0e0f0c]/10 bg-white p-3 shadow-xl">
          <input
            className="input mb-3 h-10 rounded-full"
            placeholder="搜索图标，例如 Game / Wallet / Code"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <div className="grid max-h-[320px] grid-cols-6 gap-2 overflow-y-auto pr-1">
            {filteredIcons.map((name) => {
              const Icon = categoryIconLibrary[name]
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => {
                    onChange(name)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={name === value
                    ? 'flex h-11 items-center justify-center rounded-xl bg-[#e2f6d5] text-[#163300]'
                    : 'flex h-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-50'}
                >
                  <Icon className="h-5 w-5" />
                </button>
              )
            })}
          </div>
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
  const DraftIcon = getCategoryIcon(draft.icon)

  async function save(item: CategoryItem) {
    setSaving(true)
    setError(null)
    startActionFeedback()
    try {
      const res = await fetch('/api/admin/categories', {
        method: item.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })
      if (!res.ok) throw new Error(await res.text())
      persistActionSuccess(item.id ? '分类保存成功' : '分类创建成功')
      location.reload()
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存失败'
      setError(message)
      finishActionFeedback(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function remove(item: CategoryItem) {
    if (!item.id) return
    if (!confirm(`确认删除分类「${item.name}」？已使用该分类的应用会自动变为未分类。`)) return

    setSaving(true)
    setError(null)
    startActionFeedback()
    try {
      const res = await fetch(`/api/admin/categories?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      persistActionSuccess('分类删除成功')
      setItems((current) => current.filter((entry) => entry.id !== item.id))
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除失败'
      setError(message)
      finishActionFeedback(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card grid gap-4 md:grid-cols-[52px_1fr_1fr_220px_120px_110px_110px_48px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e2f6d5] text-[#163300]"><DraftIcon className="h-5 w-5" /></div>
        <input className="input" placeholder="分类名称" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input className="input" placeholder="slug，例如 ai-apps" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
        <IconPicker value={draft.icon} onChange={(icon) => setDraft({ ...draft, icon })} />
        <input className="input" type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
        <label className="flex items-center gap-2 text-sm font-semibold text-[#454745]">
          <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
          启用
        </label>
        <button disabled={saving} onClick={() => void save(draft)} className="btn-secondary">新增分类</button>
        <span className="hidden h-12 w-12 md:block" aria-hidden="true" />
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="grid gap-4">
        {items.map((item, index) => {
          const Icon = getCategoryIcon(item.icon)
          return (
            <div key={item.id ?? index} className="card grid gap-4 md:grid-cols-[52px_1fr_1fr_220px_120px_110px_110px_48px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e2f6d5] text-[#163300]"><Icon className="h-5 w-5" /></div>
              <input className="input" value={item.name} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, name: e.target.value } : entry))} />
              <input className="input" value={item.slug} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, slug: e.target.value } : entry))} />
              <IconPicker value={item.icon} onChange={(icon) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, icon } : entry))} />
              <input className="input" type="number" value={item.sort_order} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, sort_order: Number(e.target.value) } : entry))} />
              <label className="flex items-center gap-2 text-sm font-semibold text-[#454745]">
                <input type="checkbox" checked={item.enabled} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, enabled: e.target.checked } : entry))} />
                {item.enabled ? '启用' : '停用'}
              </label>
              <button disabled={saving} onClick={() => void save(item)} className="btn-secondary">保存</button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void remove(item)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                aria-label={`删除 ${item.name}`}
                title="删除分类"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function BannerManager({
  initialItems,
  apps,
  categories
}: {
  initialItems: BannerItem[]
  apps: BannerAppOption[]
  categories: BannerCategoryOption[]
}) {
  const firstApp = apps[0]
  const empty: BannerItem = {
    title: '',
    subtitle: '',
    image_url: '',
    image_openlist_domain: '',
    cta_label: '查看详情',
    cta_href: firstApp ? `/app/${firstApp.slug}` : '/',
    placement: 'recommended',
    category_id: null,
    app_id: firstApp?.id ?? null,
    sort_order: 0,
    enabled: true
  }
  const [items, setItems] = useState<BannerItem[]>(initialItems)
  const [draft, setDraft] = useState<BannerItem>(empty)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File, apply: (url: string) => void) {
    apply(await readImageAsDataUrl(file))
  }

  async function save(item: BannerItem) {
    setError(null)
    startActionFeedback()
    try {
      const res = await fetch('/api/admin/banners', {
        method: item.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })
      if (!res.ok) throw new Error(await res.text())
      persistActionSuccess(item.id ? '轮播图保存成功' : '轮播图创建成功')
      location.reload()
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存失败'
      setError(message)
      finishActionFeedback(message, 'error')
    }
  }

  function applyApp(item: BannerItem, appId: string | null): BannerItem {
    const app = apps.find((entry) => entry.id === appId)
    if (!app) return { ...item, app_id: null }
    return {
      ...item,
      app_id: app.id,
      title: item.title || app.name,
      cta_href: item.cta_href || `/app/${app.slug}`
    }
  }

  return (
    <div className="space-y-6">
      <div className="card grid gap-4 lg:grid-cols-2">
        <label>
          <span className="label">展示位置</span>
          <select
            className="input"
            value={draft.placement}
            onChange={(e) => setDraft({
              ...draft,
              placement: e.target.value as BannerItem['placement'],
              category_id: e.target.value === 'recommended' ? null : draft.category_id
            })}
          >
            <option value="recommended">推荐页</option>
            <option value="category">分类页</option>
          </select>
        </label>
        <label>
          <span className="label">分类页，推荐页留空</span>
          <select
            className="input"
            value={draft.category_id ?? ''}
            disabled={draft.placement === 'recommended'}
            onChange={(e) => setDraft({ ...draft, category_id: e.target.value || null })}
          >
            <option value="">选择分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label className="lg:col-span-2">
          <span className="label">绑定应用</span>
          <select className="input" value={draft.app_id ?? ''} onChange={(e) => setDraft((current) => applyApp(current, e.target.value || null))}>
            <option value="">不绑定应用</option>
            {apps.map((app) => (
              <option key={app.id} value={app.id}>{app.name} / {app.slug}</option>
            ))}
          </select>
          <span className="mt-2 block text-xs text-slate-500">选择应用后，默认按钮链接会指向应用详情页。</span>
        </label>
        <input className="input" placeholder="标题" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <input className="input" placeholder="副标题" value={draft.subtitle ?? ''} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
        <input className="input" placeholder="跳转按钮文字" value={draft.cta_label ?? ''} onChange={(e) => setDraft({ ...draft, cta_label: e.target.value })} />
        <input className="input" placeholder="跳转链接" value={draft.cta_href ?? ''} onChange={(e) => setDraft({ ...draft, cta_href: e.target.value })} />
        <input className="input" placeholder="图片 URL 或上传图片" value={draft.image_url ?? ''} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} />
        <input className="input" placeholder="OpenList 图片域名，例如 oss-us-hk.smvapi.store" value={draft.image_openlist_domain ?? ''} onChange={(e) => setDraft({ ...draft, image_openlist_domain: e.target.value })} />
        <input className="input" type="file" accept="image/*" onChange={(e) => e.target.files?.[0] ? void upload(e.target.files[0], (url) => setDraft({ ...draft, image_url: url })) : undefined} />
        <label className="flex items-center gap-2 text-sm font-semibold text-[#454745]">
          <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
          启用
        </label>
        <button onClick={() => void save(draft)} className="btn lg:w-fit">新增轮播图</button>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="grid gap-4">
        {items.map((item, index) => (
          <div key={item.id ?? index} className="card grid gap-4 lg:grid-cols-[180px_1fr_auto]">
            <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
              {item.image_url ? <img src={signedImageSrc(item.image_url, item.image_openlist_domain) ?? item.image_url} alt="" className="h-full w-full object-cover" /> : <Image className="h-8 w-8" />}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <select className="input" value={item.placement} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, placement: e.target.value as BannerItem['placement'], category_id: e.target.value === 'recommended' ? null : entry.category_id } : entry))}>
                <option value="recommended">推荐页</option>
                <option value="category">分类页</option>
              </select>
              <select className="input" value={item.category_id ?? ''} disabled={item.placement === 'recommended'} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, category_id: e.target.value || null } : entry))}>
                <option value="">选择分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <select className="input md:col-span-2" value={item.app_id ?? ''} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? applyApp(entry, e.target.value || null) : entry))}>
                <option value="">不绑定应用</option>
                {apps.map((app) => (
                  <option key={app.id} value={app.id}>{app.name} / {app.slug}</option>
                ))}
              </select>
              <input className="input" value={item.title} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, title: e.target.value } : entry))} />
              <input className="input" value={item.subtitle ?? ''} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, subtitle: e.target.value } : entry))} />
              <input className="input" value={item.cta_label ?? ''} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, cta_label: e.target.value } : entry))} />
              <input className="input" value={item.cta_href ?? ''} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, cta_href: e.target.value } : entry))} />
              <input className="input md:col-span-2" value={item.image_url ?? ''} placeholder="图片 URL" onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, image_url: e.target.value } : entry))} />
              <input className="input" value={item.image_openlist_domain ?? ''} placeholder="OpenList 图片域名" onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, image_openlist_domain: e.target.value } : entry))} />
              <input className="input" type="number" value={item.sort_order} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, sort_order: Number(e.target.value) } : entry))} />
              <label className="flex items-center gap-2 text-sm font-semibold text-[#454745]">
                <input type="checkbox" checked={item.enabled} onChange={(e) => setItems((current) => current.map((entry, i) => i === index ? { ...entry, enabled: e.target.checked } : entry))} />
                {item.enabled ? '启用' : '停用'}
              </label>
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
    startActionFeedback()
    try {
      const res = await fetch('/api/admin/login-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      })
      if (!res.ok) throw new Error(await res.text())
      persistActionSuccess(item.id ? '登录方式保存成功' : '登录方式创建成功')
      location.reload()
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存失败'
      setError(message)
      finishActionFeedback(message, 'error')
    }
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
                      {item.icon_url ? <img src={signedImageSrc(item.icon_url) ?? item.icon_url} alt="" className="h-full w-full object-cover" /> : <KeyRound className="h-5 w-5 text-slate-500" />}
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
                    <img src={signedImageSrc(draft.icon_url) ?? draft.icon_url} alt="" className="h-full w-full object-cover" />
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
