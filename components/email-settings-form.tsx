'use client'

import { useState } from 'react'
import type { PublicEmailSettings } from '@/lib/email-settings'
import { finishActionFeedback, startActionFeedback } from '@/components/action-feedback'

export function EmailSettingsForm({ initialSettings }: { initialSettings: PublicEmailSettings }) {
  const [settings, setSettings] = useState(initialSettings)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function save() {
    setLoading(true)
    setMessage(null)
    startActionFeedback()
    try {
      const response = await fetch('/api/admin/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          password: password || undefined,
          keepPassword: !password && settings.hasPassword
        })
      })
      const data = await response.json() as { ok?: boolean; error?: string; detail?: unknown; settings?: PublicEmailSettings }
      if (!response.ok || !data.ok || !data.settings) {
        throw new Error(data.error ?? '保存失败')
      }
      setSettings(data.settings)
      setPassword('')
      setMessage('已保存')
      finishActionFeedback('邮箱配置保存成功')
    } catch (error) {
      const text = error instanceof Error ? error.message : '保存失败'
      setMessage(text)
      finishActionFeedback(text, 'error')
    } finally {
      setLoading(false)
    }
  }

  function updateTemplate(key: keyof PublicEmailSettings['templates'], field: 'subject' | 'body', value: string) {
    setSettings((current) => ({
      ...current,
      templates: {
        ...current.templates,
        [key]: {
          ...current.templates[key],
          [field]: value
        }
      }
    }))
  }

  return (
    <div className="space-y-6">
      <section className="card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">SMTP 发信配置</h2>
            <p className="mt-1 text-sm text-slate-500">用于发送邮箱验证码和认证审核结果邮件。密码只会加密保存，不会明文回显。</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={settings.enabled} onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })} />
            启用
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="label">SMTP Host</span>
            <input className="input" value={settings.host} onChange={(event) => setSettings({ ...settings, host: event.target.value })} placeholder="smtp.example.com" />
          </label>
          <label>
            <span className="label">端口</span>
            <input className="input" type="number" min="1" max="65535" value={settings.port} onChange={(event) => setSettings({ ...settings, port: Number(event.target.value) })} />
          </label>
          <label>
            <span className="label">用户名</span>
            <input className="input" value={settings.username} onChange={(event) => setSettings({ ...settings, username: event.target.value })} />
          </label>
          <label>
            <span className="label">SMTP 密码</span>
            <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={settings.hasPassword ? '已保存，留空则不修改' : '请输入 SMTP 密码'} />
          </label>
          <label>
            <span className="label">发件邮箱</span>
            <input className="input" type="email" value={settings.fromEmail} onChange={(event) => setSettings({ ...settings, fromEmail: event.target.value })} placeholder="noreply@example.com" />
          </label>
          <label>
            <span className="label">发件名称</span>
            <input className="input" value={settings.fromName} onChange={(event) => setSettings({ ...settings, fromName: event.target.value })} />
          </label>
        </div>

        <div className="flex flex-wrap gap-5 text-sm text-slate-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={settings.secure} onChange={(event) => setSettings({ ...settings, secure: event.target.checked })} />
            SSL/TLS 直连
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={settings.startTls} onChange={(event) => setSettings({ ...settings, startTls: event.target.checked })} />
            STARTTLS
          </label>
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">邮件主题与模板</h2>
        {Object.entries(settings.templates).map(([key, template]) => (
          <div key={key} className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-900">{templateTitle(key)}</p>
            <div className="mt-3 grid gap-3">
              <input className="input" value={template.subject} onChange={(event) => updateTemplate(key as keyof PublicEmailSettings['templates'], 'subject', event.target.value)} />
              <textarea className="input min-h-28" value={template.body} onChange={(event) => updateTemplate(key as keyof PublicEmailSettings['templates'], 'body', event.target.value)} />
            </div>
          </div>
        ))}
      </section>

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => void save()} disabled={loading} className="btn">
          {loading ? '保存中...' : '保存邮箱配置'}
        </button>
        {message ? <span className="text-sm text-slate-500">{message}</span> : null}
      </div>
    </div>
  )
}

function templateTitle(key: string) {
  if (key === 'verification_code') return '验证码邮件'
  if (key === 'identity_approved') return '认证通过邮件'
  if (key === 'identity_rejected') return '认证拒绝邮件'
  return '补充材料邮件'
}
