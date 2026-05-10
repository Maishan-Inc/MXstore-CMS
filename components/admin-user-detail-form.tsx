'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { AccountType, EnterpriseCertificationStatus, IdentityPlanStatus, IdentityPlanTier, KycStatus, TeamPlanStatus } from '@/lib/account'
import { finishActionFeedback, startActionFeedback } from '@/components/action-feedback'

type EditableUser = {
  id: string
  email: string | null
  display_name: string | null
  wallet_address: string | null
  role: 'user' | 'admin'
  account_type: AccountType
  developer_name: string | null
  organization_name: string | null
  enterprise_certification_status: EnterpriseCertificationStatus
  enterprise_certification_note: string | null
  team_plan_status: TeamPlanStatus
  identity_plan_tier: IdentityPlanTier
  identity_plan_status: IdentityPlanStatus
  kyc_status: KycStatus
  kyc_note: string | null
  download_quota_bytes: number
  distribution_quota_bytes: number
  distribution_charge_threshold_bytes: number
}

type KycDocument = {
  id: string
  document_type: string
  original_filename: string
  storage_url: string | null
  status: string
  review_note: string | null
  created_at: string
}

export function AdminUserDetailForm({ user, documents }: { user: EditableUser; documents: KycDocument[] }) {
  const router = useRouter()
  const [form, setForm] = useState(user)
  const [note, setNote] = useState(user.kyc_note ?? user.enterprise_certification_note ?? '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function save() {
    setLoading(true)
    setMessage(null)
    startActionFeedback()
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await response.json().catch(() => null) as { ok?: boolean; error?: string; detail?: string } | null
      if (!response.ok || !data?.ok) throw new Error(data?.detail ?? data?.error ?? '保存失败')
      setMessage('已保存')
      finishActionFeedback('用户资料保存成功')
      router.refresh()
    } catch (error) {
      const text = error instanceof Error ? error.message : '保存失败'
      setMessage(text)
      finishActionFeedback(text, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function review(action: 'approve' | 'reject' | 'needs_more_info') {
    setLoading(true)
    setMessage(null)
    startActionFeedback()
    try {
      const response = await fetch(`/api/admin/users/${user.id}/verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note })
      })
      const data = await response.json() as { ok?: boolean; error?: string; mailError?: string | null }
      if (!response.ok || !data.ok) throw new Error(data.error ?? '审核失败')
      setMessage(data.mailError ? `审核已保存，但邮件发送失败：${data.mailError}` : '审核已保存并发送邮件')
      finishActionFeedback(data.mailError ? '审核已保存，邮件发送失败' : '审核已保存并发送邮件', data.mailError ? 'error' : 'success')
      router.refresh()
    } catch (error) {
      const text = error instanceof Error ? error.message : '审核失败'
      setMessage(text)
      finishActionFeedback(text, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">用户资料</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="邮箱" value={form.email ?? ''} onChange={(value) => setForm({ ...form, email: value || null })} />
          <TextField label="显示名称" value={form.display_name ?? ''} onChange={(value) => setForm({ ...form, display_name: value || null })} />
          <TextField label="钱包地址" value={form.wallet_address ?? ''} onChange={(value) => setForm({ ...form, wallet_address: value || null })} />
          <SelectField label="角色" value={form.role} options={['user', 'admin']} onChange={(value) => setForm({ ...form, role: value as 'user' | 'admin' })} />
          <SelectField label="账户身份" value={form.account_type} options={['unselected', 'personal', 'independent_developer', 'team_studio', 'enterprise']} onChange={(value) => setForm({ ...form, account_type: value as AccountType })} />
          <TextField label="开发者名称" value={form.developer_name ?? ''} onChange={(value) => setForm({ ...form, developer_name: value || null })} />
          <TextField label="主体/企业名称" value={form.organization_name ?? ''} onChange={(value) => setForm({ ...form, organization_name: value || null })} />
          <SelectField label="企业认证" value={form.enterprise_certification_status} options={['not_required', 'pending', 'verified', 'needs_more_info', 'rejected']} onChange={(value) => setForm({ ...form, enterprise_certification_status: value as EnterpriseCertificationStatus })} />
          <SelectField label="团队套餐" value={form.team_plan_status} options={['none', 'pending', 'active', 'expired']} onChange={(value) => setForm({ ...form, team_plan_status: value as TeamPlanStatus })} />
          <SelectField label="会员档位" value={form.identity_plan_tier} options={['free', 'plus', 'pro', 'max']} onChange={(value) => setForm({ ...form, identity_plan_tier: value as IdentityPlanTier })} />
          <SelectField label="会员状态" value={form.identity_plan_status} options={['none', 'active', 'pending_kyc', 'expired', 'frozen']} onChange={(value) => setForm({ ...form, identity_plan_status: value as IdentityPlanStatus })} />
          <SelectField label="KYC 状态" value={form.kyc_status} options={['not_required', 'pending', 'verified', 'needs_more_info', 'rejected']} onChange={(value) => setForm({ ...form, kyc_status: value as KycStatus })} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <NumberField label="下载流量配额" value={form.download_quota_bytes} onChange={(value) => setForm({ ...form, download_quota_bytes: value })} />
          <NumberField label="分发流量配额" value={form.distribution_quota_bytes} onChange={(value) => setForm({ ...form, distribution_quota_bytes: value })} />
          <NumberField label="分发扣费阈值" value={form.distribution_charge_threshold_bytes} onChange={(value) => setForm({ ...form, distribution_charge_threshold_bytes: value })} />
        </div>
        <label className="block">
          <span className="label">认证备注</span>
          <textarea className="input min-h-24" value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void save()} disabled={loading} className="btn">{loading ? '保存中...' : '保存用户资料'}</button>
          <button type="button" onClick={() => void review('approve')} disabled={loading} className="btn-secondary">审核通过并发邮件</button>
          <button type="button" onClick={() => void review('needs_more_info')} disabled={loading} className="btn-secondary">要求补充材料</button>
          <button type="button" onClick={() => void review('reject')} disabled={loading} className="btn-secondary">拒绝认证</button>
          {message ? <span className="text-sm text-slate-500">{message}</span> : null}
        </div>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">提交的 KYC 文件</h2>
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {documents.map((document) => <AdminKycDocumentRow key={document.id} document={document} />)}
          {!documents.length ? <p className="p-4 text-sm text-slate-500">该用户还没有提交文件。</p> : null}
        </div>
      </section>
    </div>
  )
}

function AdminKycDocumentRow({ document }: { document: KycDocument }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function review(status: 'approved' | 'rejected') {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/kyc-documents/${document.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!response.ok) throw new Error(await response.text())
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 text-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="font-medium text-slate-900">{document.original_filename}</p>
        <p className="mt-1 text-xs text-slate-500">{document.document_type} · {document.status} · {new Date(document.created_at).toLocaleString()}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {document.storage_url ? <a href={document.storage_url} target="_blank" rel="noreferrer" className="wise-subtle-button px-3 py-1.5 text-xs font-semibold">查看文件</a> : null}
        <button type="button" disabled={loading} onClick={() => void review('approved')} className="wise-subtle-button px-3 py-1.5 text-xs font-semibold">文件通过</button>
        <button type="button" disabled={loading} onClick={() => void review('rejected')} className="wise-subtle-button px-3 py-1.5 text-xs font-semibold">文件拒绝</button>
      </div>
    </div>
  )
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="label">{label}</span>
      <input className="input" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label>
      <span className="label">{label}</span>
      <input className="input" type="number" min="0" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="label">{label}</span>
      <select className="input" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}
