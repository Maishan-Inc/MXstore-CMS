'use client'

import { useState } from 'react'
import type { PublicKycSettings } from '@/lib/kyc-settings'
import { finishActionFeedback, startActionFeedback } from '@/components/action-feedback'

export function KycSettingsForm({ initialSettings }: { initialSettings: PublicKycSettings }) {
  const [settings, setSettings] = useState(initialSettings)
  const [apiKey, setApiKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [secretAccessKey, setSecretAccessKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function save() {
    setLoading(true)
    setMessage(null)
    startActionFeedback()
    try {
      const response = await fetch('/api/admin/kyc-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          didit: {
            ...settings.didit,
            apiKey: apiKey || undefined,
            keepApiKey: !apiKey && settings.didit.hasApiKey,
            webhookSecret: webhookSecret || undefined,
            keepWebhookSecret: !webhookSecret && settings.didit.hasWebhookSecret
          },
          s3: {
            ...settings.s3,
            secretAccessKey: secretAccessKey || undefined,
            keepSecretAccessKey: !secretAccessKey && settings.s3.hasSecretAccessKey
          }
        })
      })
      const data = await response.json() as { ok?: boolean; error?: string; settings?: PublicKycSettings }
      if (!response.ok || !data.ok || !data.settings) throw new Error(data.error ?? '保存失败')
      setSettings(data.settings)
      setApiKey('')
      setWebhookSecret('')
      setSecretAccessKey('')
      setMessage('已保存')
      finishActionFeedback('KYC 配置保存成功')
    } catch (error) {
      const text = error instanceof Error ? error.message : '保存失败'
      setMessage(text)
      finishActionFeedback(text, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Didit.me KYC</h2>
            <p className="mt-1 text-sm text-slate-500">配置 Didit API Key、基础地址和 Workflow ID，用于发起第三方 KYC 会话。</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={settings.didit.enabled} onChange={(event) => setSettings({ ...settings, didit: { ...settings.didit, enabled: event.target.checked } })} />
            启用
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="label">API Base URL</span>
            <input className="input" value={settings.didit.baseUrl} onChange={(event) => setSettings({ ...settings, didit: { ...settings.didit, baseUrl: event.target.value } })} />
          </label>
          <label>
            <span className="label">Workflow ID</span>
            <input className="input" value={settings.didit.workflowId} onChange={(event) => setSettings({ ...settings, didit: { ...settings.didit, workflowId: event.target.value } })} />
          </label>
          <label className="md:col-span-2">
            <span className="label">API Key</span>
            <input className="input" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={settings.didit.hasApiKey ? '已保存，留空则不修改' : '请输入 Didit API Key'} />
          </label>
          <label className="md:col-span-2">
            <span className="label">Webhook Secret</span>
            <input className="input" type="password" value={webhookSecret} onChange={(event) => setWebhookSecret(event.target.value)} placeholder={settings.didit.hasWebhookSecret ? '已保存，留空则不修改' : '用于保护 Didit 回调 URL'} />
          </label>
        </div>
      </section>

      <section className="card space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">营业执照远程存储 S3</h2>
            <p className="mt-1 text-sm text-slate-500">企业上传的营业执照会按用户 ID 文件夹和英文文件名写入配置的存储桶。</p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={settings.s3.enabled} onChange={(event) => setSettings({ ...settings, s3: { ...settings.s3, enabled: event.target.checked } })} />
            启用
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className="label">Endpoint</span>
            <input className="input" value={settings.s3.endpoint} onChange={(event) => setSettings({ ...settings, s3: { ...settings.s3, endpoint: event.target.value } })} placeholder="https://s3.example.com" />
          </label>
          <label>
            <span className="label">Region</span>
            <input className="input" value={settings.s3.region} onChange={(event) => setSettings({ ...settings, s3: { ...settings.s3, region: event.target.value } })} />
          </label>
          <label>
            <span className="label">Bucket</span>
            <input className="input" value={settings.s3.bucket} onChange={(event) => setSettings({ ...settings, s3: { ...settings.s3, bucket: event.target.value } })} />
          </label>
          <label>
            <span className="label">文件夹前缀</span>
            <input className="input" value={settings.s3.prefix} onChange={(event) => setSettings({ ...settings, s3: { ...settings.s3, prefix: event.target.value } })} />
          </label>
          <label>
            <span className="label">Access Key ID</span>
            <input className="input" value={settings.s3.accessKeyId} onChange={(event) => setSettings({ ...settings, s3: { ...settings.s3, accessKeyId: event.target.value } })} />
          </label>
          <label>
            <span className="label">Secret Access Key</span>
            <input className="input" type="password" value={secretAccessKey} onChange={(event) => setSecretAccessKey(event.target.value)} placeholder={settings.s3.hasSecretAccessKey ? '已保存，留空则不修改' : '请输入 Secret'} />
          </label>
          <label>
            <span className="label">公开访问 Base URL</span>
            <input className="input" value={settings.s3.publicBaseUrl} onChange={(event) => setSettings({ ...settings, s3: { ...settings.s3, publicBaseUrl: event.target.value } })} />
          </label>
          <label className="flex items-center gap-2 pt-7 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={settings.s3.pathStyle} onChange={(event) => setSettings({ ...settings, s3: { ...settings.s3, pathStyle: event.target.checked } })} />
            使用 path-style URL
          </label>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => void save()} disabled={loading} className="btn">
          {loading ? '保存中...' : '保存 KYC 配置'}
        </button>
        {message ? <span className="text-sm text-slate-500">{message}</span> : null}
      </div>
    </div>
  )
}
