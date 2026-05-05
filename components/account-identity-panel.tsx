'use client'

import { useState } from 'react'
import { ShieldAlert, Sparkles, Users, UserRound, type LucideIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { AccountSummary, AccountType } from '@/lib/account'
import {
  canUpgradeTo,
  getAccountTypeDescription,
  getAccountTypeLabel,
  getEnterpriseStatusLabel,
  getTeamPlanLabel
} from '@/lib/account'

type SubmitState = {
  loading: boolean
  message: string | null
}

export function AccountIdentityPanel({ user }: { user: AccountSummary }) {
  const router = useRouter()
  const [states, setStates] = useState<Record<AccountType, SubmitState>>({
    unselected: { loading: false, message: null },
    personal: { loading: false, message: null },
    independent_developer: { loading: false, message: null },
    team_studio: { loading: false, message: null },
    enterprise: { loading: false, message: null }
  })

  async function submitAccountType(accountType: AccountType, payload: Record<string, string>) {
    setStates((current) => ({ ...current, [accountType]: { loading: true, message: null } }))
    try {
      const response = await fetch('/api/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_type: accountType, ...payload })
      })
      if (!response.ok) throw new Error(await response.text())
      setStates((current) => ({ ...current, [accountType]: { loading: false, message: '已更新' } }))
      router.refresh()
    } catch (error) {
      setStates((current) => ({
        ...current,
        [accountType]: { loading: false, message: error instanceof Error ? error.message : '提交失败' }
      }))
    }
  }

  function cardState(accountType: AccountType) {
    return {
      allowed: canUpgradeTo(user.account_type, accountType),
      selected: user.account_type === accountType,
      submit: states[accountType]
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <IdentityCard
        icon={UserRound}
        title="个人用户"
        description={getAccountTypeDescription('personal')}
        label={getAccountTypeLabel('personal')}
        status={user.account_type === 'personal' ? '当前身份' : undefined}
        disabled={!cardState('personal').allowed || cardState('personal').selected}
        note="个人用户只能使用和下载，不能发布应用。"
        actionText={user.account_type === 'unselected' ? '选择个人身份' : '当前已选'}
        message={cardState('personal').submit.message}
        loading={cardState('personal').submit.loading}
        onSubmit={() => void submitAccountType('personal', { developer_name: user.display_name ?? user.email ?? '' })}
      />

      <IdentityCard
        icon={Sparkles}
        title="独立开发者"
        description={getAccountTypeDescription('independent_developer')}
        label={getAccountTypeLabel('independent_developer')}
        status={user.account_type === 'independent_developer' ? '当前身份' : undefined}
        disabled={!cardState('independent_developer').allowed || cardState('independent_developer').selected}
        note="独立开发者及以上才能发布应用。应用会展示开发者头像和名称。"
        actionText="升级为独立开发者"
        message={cardState('independent_developer').submit.message}
        loading={cardState('independent_developer').submit.loading}
        onSubmit={() => void submitAccountType('independent_developer', {
          developer_name: user.display_name ?? user.email ?? '',
          developer_avatar_url: user.avatar_url ?? ''
        })}
      />

      <TeamStudioCard
        user={user}
        allowed={cardState('team_studio').allowed}
        status={user.account_type === 'team_studio' ? getTeamPlanLabel(user.team_plan_status) : undefined}
        loading={cardState('team_studio').submit.loading}
        message={cardState('team_studio').submit.message}
        onSubmit={(organizationName) => void submitAccountType('team_studio', {
          organization_name: organizationName,
          developer_name: user.display_name ?? user.email ?? '',
          developer_avatar_url: user.avatar_url ?? ''
        })}
      />

      <EnterpriseCard
        user={user}
        allowed={cardState('enterprise').allowed}
        status={user.account_type === 'enterprise' ? getEnterpriseStatusLabel(user.enterprise_certification_status) : undefined}
        loading={cardState('enterprise').submit.loading}
        message={cardState('enterprise').submit.message}
        onSubmit={(organizationName, note) => void submitAccountType('enterprise', {
          organization_name: organizationName,
          enterprise_certification_note: note,
          developer_name: organizationName,
          developer_avatar_url: user.avatar_url ?? ''
        })}
      />
    </div>
  )
}

function IdentityCard({
  icon: Icon,
  title,
  description,
  label,
  note,
  status,
  disabled,
  actionText,
  loading,
  message,
  onSubmit
}: {
  icon: LucideIcon
  title: string
  description: string
  label: string
  note: string
  status?: string
  disabled: boolean
  actionText: string
  loading: boolean
  message: string | null
  onSubmit: () => void
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-950">{title}</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{label}</span>
            {status ? <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">{status}</span> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">{note}</p>
          {message ? <p className="mt-2 text-sm text-rose-600">{message}</p> : null}
        </div>
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || loading}
        className="btn-secondary mt-5 inline-flex items-center gap-2"
      >
        {loading ? '提交中...' : actionText}
      </button>
    </section>
  )
}

function TeamStudioCard({
  user,
  allowed,
  status,
  loading,
  message,
  onSubmit
}: {
  user: AccountSummary
  allowed: boolean
  status?: string
  loading: boolean
  message: string | null
  onSubmit: (organizationName: string) => void
}) {
  const [organizationName, setOrganizationName] = useState(user.organization_name ?? user.display_name ?? user.email ?? '')

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <Users className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-950">团队工作室</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">需要团队版套餐</span>
            {status ? <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">{status}</span> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">团队账号会使用公司或工作室名称发布应用，开通团队版套餐后才能正式发布。</p>
          {message ? <p className="mt-2 text-sm text-rose-600">{message}</p> : null}
        </div>
      </div>
      <label className="mt-5 block">
        <span className="label">团队名称</span>
        <input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} className="input" placeholder="公司名称或工作室名称" />
      </label>
      <button
        type="button"
        onClick={() => onSubmit(organizationName.trim())}
        disabled={!allowed || loading || !organizationName.trim()}
        className="btn-secondary mt-4 inline-flex items-center gap-2"
      >
        {loading ? '提交中...' : '提交团队身份'}
      </button>
    </section>
  )
}

function EnterpriseCard({
  user,
  allowed,
  status,
  loading,
  message,
  onSubmit
}: {
  user: AccountSummary
  allowed: boolean
  status?: string
  loading: boolean
  message: string | null
  onSubmit: (organizationName: string, note: string) => void
}) {
  const [organizationName, setOrganizationName] = useState(user.organization_name ?? user.display_name ?? user.email ?? '')
  const [note, setNote] = useState(user.enterprise_certification_note ?? '')

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-slate-950">企业用户</h3>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">需要企业认证</span>
            {status ? <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">{status}</span> : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">请向客户服务支持提交营业执照、社会信用代码、公司名称等材料，审核完成后才能继续使用企业身份登录和发布应用。</p>
          {message ? <p className="mt-2 text-sm text-rose-600">{message}</p> : null}
        </div>
      </div>
      <div className="mt-5 grid gap-4">
        <label className="block">
          <span className="label">公司名称</span>
          <input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} className="input" placeholder="营业执照上的公司名称" />
        </label>
        <label className="block">
          <span className="label">补充材料说明</span>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} className="input min-h-28" placeholder="例如：营业执照、社会信用代码、对公联系人、认证邮箱等" />
        </label>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">缺少材料时，客服可能会继续向你补充索取文件。</p>
      <button
        type="button"
        onClick={() => onSubmit(organizationName.trim(), note.trim())}
        disabled={!allowed || loading || !organizationName.trim() || !note.trim()}
        className="btn-secondary mt-4 inline-flex items-center gap-2"
      >
        {loading ? '提交中...' : '提交企业认证'}
      </button>
    </section>
  )
}
