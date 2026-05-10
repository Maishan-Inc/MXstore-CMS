'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { appFormDefaults, fileSizeInputToBytes, type AdminAppFormValues, type AdminAppLinkInput } from '@/lib/admin/apps'
import { finishActionFeedback, persistActionSuccess, startActionFeedback } from '@/components/action-feedback'

type AdminAppFormProps = {
  mode?: 'create' | 'edit'
  appId?: string
  initialValues?: AdminAppFormValues
  categories?: Array<{ id: string; name: string }>
  editBasePath?: string
}

function makeNewLink(index: number): AdminAppLinkInput {
  return {
    id: null,
    name: `下载 ${index + 1}`,
    input_url: '',
    file_size_bytes: '',
    file_size_unit: 'GB',
    charge_traffic: true,
    sort_order: index
  }
}

export function AdminAppForm({ mode = 'create', appId, initialValues, categories = [], editBasePath = '/admin/apps' }: AdminAppFormProps) {
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
    startActionFeedback()
    const payload = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      version: formData.get('version'),
      platform: formData.get('platform'),
      logo_url: formData.get('logo_url'),
      official_url: formData.get('official_url'),
      screenshot_urls: formData.get('screenshot_urls'),
      feature_highlights: formData.get('feature_highlights'),
      changelog: formData.get('changelog'),
      release_date: formData.get('release_date'),
      language: formData.get('language'),
      license_name: formData.get('license_name'),
      system_requirements: formData.get('system_requirements'),
      rating_score: Number(formData.get('rating_score') || 4.8),
      rating_count: Number(formData.get('rating_count') || 0),
      download_count: Number(formData.get('download_count') || 0),
      show_on_recommended: formData.get('show_on_recommended') === 'on',
      recommendation_heat: Number(formData.get('recommendation_heat') || 0),
      developer_name: formData.get('developer_name'),
      developer_avatar_url: formData.get('developer_avatar_url'),
      category_id: String(formData.get('category_id') ?? ''),
      download_permission: String(formData.get('download_permission') || 'login'),
      is_paid: formData.get('download_permission') === 'purchase',
      price_cents: Number(formData.get('price_cents') || 0),
      currency: String(formData.get('currency') || 'USD'),
      published: formData.get('published') === 'on',
      links: links.map((link, index) => ({
        id: link.id,
        name: link.name || `下载 ${index + 1}`,
        input_url: link.input_url,
        file_size_bytes: fileSizeInputToBytes(link.file_size_bytes, link.file_size_unit),
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
      persistActionSuccess(mode === 'create' ? '应用创建成功' : '应用保存成功')
      router.push(`${editBasePath}/${data.id}/edit`)
      router.refresh()
    } catch (e) {
      const message = e instanceof Error ? e.message : mode === 'create' ? '创建失败' : '保存失败'
      setError(message)
      finishActionFeedback(message, 'error')
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
          <span className="label">应用分类</span>
          <select name="category_id" defaultValue={defaults.category_id} className="input">
            <option value="">不选择分类</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Logo URL</span>
          <input name="logo_url" defaultValue={defaults.logo_url} className="input" placeholder="https://..." />
          <span className="mt-2 block text-xs text-slate-500">支持 OpenList 签名图片链接，系统保存后会自动按域名生成临时访问地址。</span>
        </label>
        <label>
          <span className="label">官网 URL</span>
          <input name="official_url" defaultValue={defaults.official_url} className="input" placeholder="https://..." />
        </label>
        <label>
          <span className="label">开发者名称</span>
          <input name="developer_name" defaultValue={defaults.developer_name} className="input" required placeholder="开发者、团队或公司名称" />
        </label>
        <label>
          <span className="label">开发者头像 URL</span>
          <input name="developer_avatar_url" defaultValue={defaults.developer_avatar_url} className="input" placeholder="https://..." />
          <span className="mt-2 block text-xs text-slate-500">同样支持 OpenList 图片签名地址。</span>
        </label>
        <label>
          <span className="label">货币</span>
          <input name="currency" defaultValue={defaults.currency} className="input" />
        </label>
        <label>
          <span className="label">发布日期</span>
          <input name="release_date" type="date" defaultValue={defaults.release_date} className="input" />
        </label>
        <label>
          <span className="label">语言</span>
          <input name="language" defaultValue={defaults.language} className="input" placeholder="简体中文" />
        </label>
        <label>
          <span className="label">授权方式</span>
          <input name="license_name" defaultValue={defaults.license_name} className="input" placeholder="免费 / 商业授权 / 开源" />
        </label>
        <label>
          <span className="label">评分</span>
          <input name="rating_score" type="number" min="0" max="5" step="0.1" defaultValue={defaults.rating_score} className="input" />
        </label>
        <label>
          <span className="label">评价数</span>
          <input name="rating_count" type="number" min="0" defaultValue={defaults.rating_count} className="input" />
        </label>
        <label>
          <span className="label">下载量</span>
          <input name="download_count" type="number" min="0" defaultValue={defaults.download_count} className="input" />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input name="show_on_recommended" type="checkbox" defaultChecked={defaults.show_on_recommended} /> 在推荐页面显示
        </label>
        <label>
          <span className="label">推荐热度，系统内部排序</span>
          <input name="recommendation_heat" type="number" min="0" defaultValue={defaults.recommendation_heat} className="input" />
          <span className="mt-2 block text-xs text-slate-500">勾选推荐页显示时必须填写大于 0 的推荐热度。数值越大，推荐页排序越靠前。</span>
        </label>
        <label className="md:col-span-2">
          <span className="label">描述</span>
          <textarea name="description" defaultValue={defaults.description} className="input min-h-28" placeholder="应用介绍、更新日志、安装说明" />
        </label>
        <label className="md:col-span-2">
          <span className="label">应用截图 URL</span>
          <textarea name="screenshot_urls" defaultValue={defaults.screenshot_urls} className="input min-h-28" placeholder={'每行一个图片 URL\nhttps://.../screenshot-1.png\nhttps://.../screenshot-2.png'} />
          <span className="mt-2 block text-xs text-slate-500">详情页会按顺序展示，支持 OpenList 签名图片链接。</span>
        </label>
        <label className="md:col-span-2">
          <span className="label">功能亮点</span>
          <textarea name="feature_highlights" defaultValue={defaults.feature_highlights} className="input min-h-24" placeholder={'每行一个亮点，例如：\n超快下载：多线程下载引擎\nMod 与整合包：一键安装与管理'} />
        </label>
        <label className="md:col-span-2">
          <span className="label">更新日志</span>
          <textarea name="changelog" defaultValue={defaults.changelog} className="input min-h-24" placeholder="每行一条更新内容" />
        </label>
        <label className="md:col-span-2">
          <span className="label">系统支持</span>
          <input name="system_requirements" defaultValue={defaults.system_requirements} className="input" placeholder="Windows 7/8/10/11" />
        </label>
        <label>
          <span className="label">下载权限</span>
          <select name="download_permission" defaultValue={defaults.download_permission} className="input">
            <option value="public">免登录下载</option>
            <option value="login">登录后下载</option>
            <option value="purchase">购买/授权后下载</option>
          </select>
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
            <label className="flex flex-col">
              <span className="label">文件大小</span>
              <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-2">
                <input className="input" type="number" step="0.01" min="0" value={link.file_size_bytes} onChange={(e) => updateLink(index, { file_size_bytes: e.target.value })} />
                <select className="input" value={link.file_size_unit} onChange={(e) => updateLink(index, { file_size_unit: e.target.value as AdminAppLinkInput['file_size_unit'] })}>
                  <option value="MB">MB</option>
                  <option value="GB">GB</option>
                </select>
              </div>
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
      <div className="flex justify-center">
        <button disabled={loading} className="btn min-w-44">
          {loading ? (mode === 'create' ? '创建中...' : '保存中...') : mode === 'create' ? '创建应用' : '保存应用'}
        </button>
      </div>
    </form>
  )
}
