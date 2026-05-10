'use client'

import { useState } from 'react'
import type { FooterSettings } from '@/lib/footer-settings'
import { finishActionFeedback, startActionFeedback } from '@/components/action-feedback'

export function FooterSettingsForm({ initialSettings }: { initialSettings: FooterSettings }) {
  const [settings, setSettings] = useState<FooterSettings>(initialSettings)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    setError(null)
    startActionFeedback()
    try {
      const response = await fetch('/api/admin/footer-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (!response.ok) throw new Error(await response.text())
      finishActionFeedback('底部栏设置保存成功')
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存失败'
      setError(message)
      finishActionFeedback(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">底部栏基础信息</h2>
            <p className="mt-1 text-sm text-slate-500">控制前台应用、详情、协议和隐私页面的底部栏显示。</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) => setSettings((current) => ({ ...current, enabled: event.target.checked }))}
            />
            开启底部栏
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="label">品牌名称</span>
            <input className="input" value={settings.brandName} onChange={(event) => setSettings((current) => ({ ...current, brandName: event.target.value }))} />
          </label>
          <label>
            <span className="label">版权信息</span>
            <input className="input" value={settings.copyright} onChange={(event) => setSettings((current) => ({ ...current, copyright: event.target.value }))} />
          </label>
          <label className="md:col-span-2">
            <span className="label">公司说明</span>
            <textarea className="input min-h-32" value={settings.description} onChange={(event) => setSettings((current) => ({ ...current, description: event.target.value }))} />
          </label>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">快捷目录</h2>
        <p className="text-sm text-slate-500">底部栏固定展示四组快捷目录：分类、用户后台、协议、文档。</p>
        <div className="grid gap-4 xl:grid-cols-2">
          {settings.linkGroups.map((group, groupIndex) => (
            <div key={`${group.title}-${groupIndex}`} className="rounded-2xl border border-slate-200 p-4">
              <input
                className="input mb-3"
                value={group.title}
                onChange={(event) => setSettings((current) => ({
                  ...current,
                  linkGroups: current.linkGroups.map((item, itemIndex) => itemIndex === groupIndex ? { ...item, title: event.target.value } : item)
                }))}
                placeholder="目录名称"
              />
              <div className="grid gap-3">
                {group.links.map((link, linkIndex) => (
                  <div key={`${group.title}-${link.label}-${linkIndex}`} className="grid gap-3 md:grid-cols-[1fr_1.4fr_90px]">
                    <input
                      className="input"
                      value={link.label}
                      onChange={(event) => setSettings((current) => ({
                        ...current,
                        linkGroups: current.linkGroups.map((currentGroup, currentGroupIndex) => currentGroupIndex === groupIndex
                          ? {
                              ...currentGroup,
                              links: currentGroup.links.map((item, itemIndex) => itemIndex === linkIndex ? { ...item, label: event.target.value } : item)
                            }
                          : currentGroup)
                      }))}
                      placeholder="链接名称"
                    />
                    <input
                      className="input"
                      value={link.href}
                      onChange={(event) => setSettings((current) => ({
                        ...current,
                        linkGroups: current.linkGroups.map((currentGroup, currentGroupIndex) => currentGroupIndex === groupIndex
                          ? {
                              ...currentGroup,
                              links: currentGroup.links.map((item, itemIndex) => itemIndex === linkIndex ? { ...item, href: event.target.value } : item)
                            }
                          : currentGroup)
                      }))}
                      placeholder="/terms 或 https://..."
                    />
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                      <input
                        type="checkbox"
                        checked={link.enabled}
                        onChange={(event) => setSettings((current) => ({
                          ...current,
                          linkGroups: current.linkGroups.map((currentGroup, currentGroupIndex) => currentGroupIndex === groupIndex
                            ? {
                                ...currentGroup,
                                links: currentGroup.links.map((item, itemIndex) => itemIndex === linkIndex ? { ...item, enabled: event.target.checked } : item)
                              }
                            : currentGroup)
                        }))}
                      />
                      显示
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">社交媒体</h2>
        <p className="text-sm text-slate-500">填写地址并开启后，底部栏会显示对应官方图标。</p>
        <div className="grid gap-4">
          {settings.socials.map((social, index) => (
            <div key={social.id} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-[160px_minmax(0,1fr)_120px]">
              <div className="flex items-center text-sm font-semibold text-slate-900">{social.label}</div>
              <input
                className="input"
                value={social.href}
                onChange={(event) => setSettings((current) => ({
                  ...current,
                  socials: current.socials.map((item, itemIndex) => itemIndex === index ? { ...item, href: event.target.value } : item)
                }))}
                placeholder="https://..."
              />
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={social.enabled}
                  onChange={(event) => setSettings((current) => ({
                    ...current,
                    socials: current.socials.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: event.target.checked } : item)
                  }))}
                />
                显示
              </label>
            </div>
          ))}
        </div>
      </section>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <button type="button" disabled={loading} onClick={() => void save()} className="btn min-w-40">
        {loading ? '保存中...' : '保存底部栏'}
      </button>
    </div>
  )
}
