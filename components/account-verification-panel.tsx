'use client'

import { useState } from 'react'
import type { StoreUser } from '@/lib/auth'
import { finishActionFeedback, startActionFeedback } from '@/components/action-feedback'

type DocumentRecord = {
  id: string
  document_type: string
  original_filename: string
  storage_url: string | null
  status: string
  review_note: string | null
  created_at: string
}

type Props = {
  user: StoreUser
  documents: DocumentRecord[]
}

type EmailPurpose = 'account_email' | 'identity_public_email' | 'identity_private_email'

export function AccountVerificationPanel({ user, documents }: Props) {
  return (
    <div className="space-y-6">
      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">邮箱验证码</h2>
          <p className="mt-1 text-sm text-slate-500">个人开发者、团队和企业账户都需要完成邮箱验证码验证。</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <EmailVerificationCard
            title="账户邮箱"
            purpose="account_email"
            initialEmail={user.email ?? ''}
            verifiedAt={user.email_verified_at}
          />
          <EmailVerificationCard
            title="团队公开邮箱"
            purpose="identity_public_email"
            initialEmail={user.identity_public_email ?? ''}
            verifiedAt={user.identity_public_email_verified_at}
          />
          <EmailVerificationCard
            title="团队私密邮箱"
            purpose="identity_private_email"
            initialEmail={user.identity_private_email ?? ''}
            verifiedAt={user.identity_private_email_verified_at}
          />
        </div>
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">企业营业执照</h2>
          <p className="mt-1 text-sm text-slate-500">企业用户上传营业执照后，文件会写入管理员配置的 S3 存储桶，并进入后台审核。</p>
        </div>
        <KycDocumentUploader />
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {documents.map((document) => (
            <div key={document.id} className="flex flex-col gap-2 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-900">{document.original_filename}</p>
                <p className="mt-1 text-xs text-slate-500">{document.document_type} · {new Date(document.created_at).toLocaleString()}</p>
                {document.review_note ? <p className="mt-1 text-xs text-amber-700">{document.review_note}</p> : null}
              </div>
              <div className="flex items-center gap-3">
                {document.storage_url ? <a href={document.storage_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600">查看文件</a> : null}
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{statusLabel(document.status)}</span>
              </div>
            </div>
          ))}
          {!documents.length ? <p className="p-4 text-sm text-slate-500">还没有提交营业执照材料。</p> : null}
        </div>
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Didit.me KYC</h2>
          <p className="mt-1 text-sm text-slate-500">发起第三方 KYC 验证后，完成结果会回写到账户 KYC 状态。</p>
        </div>
        <DiditStartButton />
      </section>
    </div>
  )
}

function EmailVerificationCard({ title, purpose, initialEmail, verifiedAt }: { title: string; purpose: EmailPurpose; initialEmail: string; verifiedAt: string | null }) {
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(verifiedAt ? `已验证：${new Date(verifiedAt).toLocaleString()}` : null)

  async function post(url: string, body: unknown) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; detail?: string } | null
    if (!response.ok || !data?.ok) throw new Error(data?.detail ?? data?.error ?? '操作失败')
  }

  async function sendCode() {
    setLoading(true)
    setMessage(null)
    startActionFeedback()
    try {
      await post('/api/account/email-verification/send', { purpose, email })
      setMessage('验证码已发送')
      finishActionFeedback('验证码已发送')
    } catch (error) {
      const text = error instanceof Error ? error.message : '验证码发送失败'
      setMessage(text)
      finishActionFeedback(text, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode() {
    setLoading(true)
    setMessage(null)
    startActionFeedback()
    try {
      await post('/api/account/email-verification/verify', { purpose, email, code })
      setMessage('邮箱验证成功')
      finishActionFeedback('邮箱验证成功')
    } catch (error) {
      const text = error instanceof Error ? error.message : '验证失败'
      setMessage(text)
      finishActionFeedback(text, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-3">
        <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" />
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input className="input" value={code} onChange={(event) => setCode(event.target.value)} placeholder="6 位验证码" maxLength={6} />
          <button type="button" onClick={() => void verifyCode()} disabled={loading || !code} className="btn-secondary">验证</button>
        </div>
        <button type="button" onClick={() => void sendCode()} disabled={loading || !email} className="wise-subtle-button w-full px-4 py-2 text-sm font-semibold">
          发送验证码
        </button>
        {message ? <p className="text-xs text-slate-500">{message}</p> : null}
      </div>
    </div>
  )
}

function KycDocumentUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function upload() {
    if (!file) return
    setLoading(true)
    setMessage(null)
    startActionFeedback()
    try {
      const formData = new FormData()
      formData.set('document_type', 'business_license')
      formData.set('file', file)
      const response = await fetch('/api/account/kyc/document', { method: 'POST', body: formData })
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; detail?: string } | null
      if (!response.ok || !data?.ok) throw new Error(data?.detail ?? data?.error ?? '上传失败')
      setMessage('营业执照已提交，等待管理员审核')
      finishActionFeedback('营业执照已提交')
    } catch (error) {
      const text = error instanceof Error ? error.message : '上传失败'
      setMessage(text)
      finishActionFeedback(text, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-3 rounded-xl border border-dashed border-slate-300 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
      <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="text-sm text-slate-600" />
      <button type="button" onClick={() => void upload()} disabled={loading || !file} className="btn-secondary">
        {loading ? '上传中...' : '上传营业执照'}
      </button>
      {message ? <p className="text-sm text-slate-500 sm:col-span-2">{message}</p> : null}
    </div>
  )
}

function DiditStartButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function start() {
    setLoading(true)
    setMessage(null)
    startActionFeedback()
    try {
      const response = await fetch('/api/account/kyc/didit/start', { method: 'POST' })
      const data = await response.json() as { ok?: boolean; error?: string; detail?: unknown; verificationUrl?: string }
      if (!response.ok || !data.ok) throw new Error(data.error ?? 'Didit KYC 发起失败')
      if (data.verificationUrl) {
        window.location.href = data.verificationUrl
        return
      }
      setMessage('Didit 会话已创建，但未返回跳转地址')
      finishActionFeedback('Didit 会话已创建')
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Didit KYC 发起失败'
      setMessage(text)
      finishActionFeedback(text, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => void start()} disabled={loading} className="btn">
        {loading ? '创建会话中...' : '发起 Didit KYC'}
      </button>
      {message ? <span className="text-sm text-slate-500">{message}</span> : null}
    </div>
  )
}

function statusLabel(status: string) {
  if (status === 'approved') return '已通过'
  if (status === 'rejected') return '未通过'
  return '待审核'
}
