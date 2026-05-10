'use client'

import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  Building2,
  Check,
  Download,
  Info,
  Lightbulb,
  Send,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  UserRound,
  Users,
  X,
  type LucideIcon
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { AccountSummary } from '@/lib/account'
import { finishActionFeedback, startActionFeedback } from '@/components/action-feedback'
import { canUpgradeTo, getEnterpriseStatusLabel, getTeamPlanLabel } from '@/lib/account'
import {
  getOrderedIdentityPlans,
  type IdentityPlan,
  type IdentityPlanSettings,
  type IdentityPlanType
} from '@/lib/identity-plans'

type SubmitState = {
  loading: boolean
  message: string | null
}

const initialSubmitStates: Record<IdentityPlanType, SubmitState> = {
  personal: { loading: false, message: null },
  independent_developer: { loading: false, message: null },
  team_studio: { loading: false, message: null },
  enterprise: { loading: false, message: null }
}

const cardIcons: Record<IdentityPlanType, LucideIcon> = {
  personal: UserRound,
  independent_developer: Sparkles,
  team_studio: Users,
  enterprise: Building2
}

const cardOrder: IdentityPlanType[] = ['personal', 'independent_developer', 'team_studio', 'enterprise']

const comparisonColumns: Array<{ type: IdentityPlanType; label: string; icon: LucideIcon }> = [
  { type: 'personal', label: '个人用户', icon: UserCircle2 },
  { type: 'independent_developer', label: '独立开发者', icon: Sparkles },
  { type: 'team_studio', label: '团队工作室', icon: Users },
  { type: 'enterprise', label: '企业用户', icon: Building2 }
]

const comparisonRows: Array<{
  icon: LucideIcon
  title: string
  helper: string
  values: Record<IdentityPlanType, boolean>
}> = [
  {
    icon: Download,
    title: '使用与下载',
    helper: '全部身份可用',
    values: { personal: true, independent_developer: true, team_studio: true, enterprise: true }
  },
  {
    icon: Send,
    title: '发布应用',
    helper: '独立开发者 / 团队 / 企业可用',
    values: { personal: false, independent_developer: true, team_studio: true, enterprise: true }
  },
  {
    icon: UserCircle2,
    title: '开发者头像与名称展示',
    helper: '独立开发者及以上',
    values: { personal: false, independent_developer: true, team_studio: true, enterprise: true }
  },
  {
    icon: Users,
    title: '团队名称发布',
    helper: '团队工作室 / 企业用户',
    values: { personal: false, independent_developer: false, team_studio: true, enterprise: true }
  },
  {
    icon: ShieldCheck,
    title: '企业认证支持',
    helper: '企业用户',
    values: { personal: false, independent_developer: false, team_studio: false, enterprise: true }
  }
]

export function AccountIdentityPanel({ user, settings }: { user: AccountSummary; settings: IdentityPlanSettings }) {
  const router = useRouter()
  const [states, setStates] = useState<Record<IdentityPlanType, SubmitState>>(initialSubmitStates)
  const [teamName, setTeamName] = useState(user.organization_name ?? user.display_name ?? user.email ?? '')
  const [enterpriseName, setEnterpriseName] = useState(user.organization_name ?? user.display_name ?? user.email ?? '')
  const [enterpriseNote, setEnterpriseNote] = useState(user.enterprise_certification_note ?? '')
  const orderedPlans = useMemo(() => getOrderedIdentityPlans(settings), [settings])

  async function submitAccountType(accountType: IdentityPlanType, payload: Record<string, string>) {
    setStates((current) => ({ ...current, [accountType]: { loading: true, message: null } }))
    startActionFeedback()
    try {
      const response = await fetch('/api/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_type: accountType, ...payload })
      })
      if (!response.ok) throw new Error(await response.text())
      setStates((current) => ({ ...current, [accountType]: { loading: false, message: '已更新' } }))
      router.refresh()
      finishActionFeedback('账户身份提交成功')
    } catch (error) {
      const message = error instanceof Error ? error.message : '提交失败'
      setStates((current) => ({
        ...current,
        [accountType]: { loading: false, message }
      }))
      finishActionFeedback(message, 'error')
    }
  }

  function cardState(accountType: IdentityPlanType) {
    return {
      allowed: canUpgradeTo(user.account_type, accountType),
      selected: user.account_type === accountType,
      submit: states[accountType]
    }
  }

  function payloadFor(accountType: IdentityPlanType): Record<string, string> {
    if (accountType === 'personal') {
      return { developer_name: user.display_name ?? user.email ?? '' }
    }

    if (accountType === 'independent_developer') {
      return {
        developer_name: user.display_name ?? user.email ?? '',
        developer_avatar_url: user.avatar_url ?? ''
      }
    }

    if (accountType === 'team_studio') {
      return {
        organization_name: teamName.trim(),
        developer_name: user.display_name ?? user.email ?? '',
        developer_avatar_url: user.avatar_url ?? ''
      }
    }

    return {
      organization_name: enterpriseName.trim(),
      enterprise_certification_note: enterpriseNote.trim(),
      developer_name: enterpriseName.trim(),
      developer_avatar_url: user.avatar_url ?? ''
    }
  }

  function hasRequiredInput(accountType: IdentityPlanType) {
    if (accountType === 'team_studio') return Boolean(teamName.trim())
    if (accountType === 'enterprise') return Boolean(enterpriseName.trim() && enterpriseNote.trim())
    return true
  }

  function submitFromPlan(accountType: IdentityPlanType) {
    if (!hasRequiredInput(accountType)) {
      setStates((current) => ({
        ...current,
        [accountType]: {
          loading: false,
          message: accountType === 'team_studio' ? '请先填写团队名称' : '请先填写公司名称和认证材料说明'
        }
      }))
      document.getElementById(`identity-${accountType}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    void submitAccountType(accountType, payloadFor(accountType))
  }

  return (
    <div className="space-y-14">
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-5 md:grid-cols-2">
          {cardOrder.map((type) => {
            const plan = settings.plans[type]
            const state = cardState(type)
            return (
              <IdentityCard
                key={type}
                id={`identity-${type}`}
                plan={plan}
                icon={cardIcons[type]}
                selected={state.selected}
                status={statusForType(type, user)}
                disabled={!state.allowed || state.selected}
                loading={state.submit.loading}
                message={state.submit.message}
                teamName={teamName}
                enterpriseName={enterpriseName}
                enterpriseNote={enterpriseNote}
                onTeamNameChange={setTeamName}
                onEnterpriseNameChange={setEnterpriseName}
                onEnterpriseNoteChange={setEnterpriseNote}
                onSubmit={() => submitFromPlan(type)}
              />
            )
          })}
        </div>

        <ComparisonPanel />
      </div>

      <section className="scroll-mt-24" id="identity-plans">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#0e0f0c]">选择适合你的套餐</h2>
            <p className="mt-2 text-sm leading-6 text-[#868685]">个人用户、独立开发者、企业用户和团队工作室的套餐文案都可在管理员后台修改。</p>
          </div>
          <a href="#identity-top" className="wise-subtle-button px-4 py-2 text-sm font-semibold">返回身份选择</a>
        </div>
        <div className="grid gap-4 lg:grid-cols-4">
          {orderedPlans.map((plan) => {
            const state = cardState(plan.type)
            return (
              <MembershipPlanCard
                key={plan.type}
                plan={plan}
                selected={state.selected}
                disabled={!state.allowed || state.selected}
                loading={state.submit.loading}
                onSubmit={() => submitFromPlan(plan.type)}
              />
            )
          })}
        </div>
      </section>
    </div>
  )
}

function statusForType(type: IdentityPlanType, user: AccountSummary) {
  if (user.account_type !== type) return undefined
  if (type === 'team_studio') return getTeamPlanLabel(user.team_plan_status)
  if (type === 'enterprise') return getEnterpriseStatusLabel(user.enterprise_certification_status)
  return '当前身份'
}

function IdentityCard({
  id,
  plan,
  icon: Icon,
  selected,
  status,
  disabled,
  loading,
  message,
  teamName,
  enterpriseName,
  enterpriseNote,
  onTeamNameChange,
  onEnterpriseNameChange,
  onEnterpriseNoteChange,
  onSubmit
}: {
  id: string
  plan: IdentityPlan
  icon: LucideIcon
  selected: boolean
  status?: string
  disabled: boolean
  loading: boolean
  message: string | null
  teamName: string
  enterpriseName: string
  enterpriseNote: string
  onTeamNameChange: (value: string) => void
  onEnterpriseNameChange: (value: string) => void
  onEnterpriseNoteChange: (value: string) => void
  onSubmit: () => void
}) {
  const isEnterprise = plan.type === 'enterprise'
  const isTeam = plan.type === 'team_studio'
  const shouldShowForm = isEnterprise || isTeam

  return (
    <section
      id={id}
      className={`group flex min-h-[342px] flex-col rounded-[24px] border bg-white p-6 shadow-[0_18px_42px_rgba(14,15,12,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[#9fe870] hover:shadow-[0_22px_48px_rgba(22,51,0,0.12)] ${
        selected || plan.highlighted ? 'border-[#9fe870] ring-1 ring-[#9fe870]' : 'border-[#0e0f0c]/10'
      }`}
    >
      <div className="flex justify-end">
        {plan.badge ? <span className="rounded-full bg-[#e2f6d5] px-3 py-1 text-xs font-black text-[#163300]">{plan.badge}</span> : <span className="h-7" />}
      </div>

      <div className="flex flex-1 flex-col items-center text-center">
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-full transition duration-300 group-hover:scale-105 ${
            selected || plan.highlighted ? 'bg-[#e2f6d5] text-[#2f9e0c]' : 'bg-[#f2f5ed] text-[#868685]'
          }`}
        >
          <Icon className="h-10 w-10" />
        </div>
        <h3 className="mt-5 text-2xl font-black text-[#0e0f0c]">{plan.title}</h3>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[#454745]">{plan.description}</p>

        <div className="mt-5 flex items-start gap-2 rounded-[16px] bg-[#f7f8f2] px-4 py-3 text-left text-sm leading-6 text-[#5f625d]">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#868685]" />
          <span>{plan.note}</span>
        </div>

        {status ? <span className="mt-4 rounded-full bg-[#e2f6d5] px-3 py-1 text-xs font-black text-[#163300]">{status}</span> : null}
        {message ? <p className="mt-3 text-sm font-semibold text-rose-600">{message}</p> : null}
      </div>

      {shouldShowForm ? (
        <div className="mt-5 space-y-3">
          {isTeam ? (
            <label className="block text-left">
              <span className="label">团队名称</span>
              <input value={teamName} onChange={(event) => onTeamNameChange(event.target.value)} className="input" placeholder="公司名称或工作室名称" />
            </label>
          ) : null}
          {isEnterprise ? (
            <>
              <label className="block text-left">
                <span className="label">公司名称</span>
                <input
                  value={enterpriseName}
                  onChange={(event) => onEnterpriseNameChange(event.target.value)}
                  className="input"
                  placeholder="营业执照上的公司名称"
                />
              </label>
              <label className="block text-left">
                <span className="label">补充材料说明</span>
                <textarea
                  value={enterpriseNote}
                  onChange={(event) => onEnterpriseNoteChange(event.target.value)}
                  className="input min-h-24"
                  maxLength={500}
                  placeholder="例如：营业执照、社会信用代码、对公联系人、认证邮箱等"
                />
              </label>
            </>
          ) : null}
        </div>
      ) : null}

      <button type="button" onClick={onSubmit} disabled={disabled || loading} className="btn mt-5 w-full">
        {loading ? '提交中...' : selected ? '当前身份' : plan.ctaLabel}
      </button>
    </section>
  )
}

function ComparisonPanel() {
  return (
    <aside className="rounded-[24px] border border-[#0e0f0c]/10 bg-white p-6 shadow-[0_18px_42px_rgba(14,15,12,0.06)]">
      <h2 className="text-xl font-black text-[#0e0f0c]">身份权益对比</h2>

      <div className="mt-7 grid grid-cols-[150px_repeat(4,minmax(0,1fr))] items-end gap-0 border-b border-[#0e0f0c]/10 pb-4">
        <span />
        {comparisonColumns.map((column) => {
          const Icon = column.icon
          return (
            <div key={column.type} className="flex flex-col items-center gap-2 text-center text-xs font-black leading-5 text-[#454745]">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e2f6d5] text-[#2f9e0c]">
                <Icon className="h-5 w-5" />
              </span>
              <span>{column.label}</span>
            </div>
          )
        })}
      </div>

      <div>
        {comparisonRows.map((row) => {
          const Icon = row.icon
          return (
            <div key={row.title} className="grid grid-cols-[150px_repeat(4,minmax(0,1fr))] items-center border-b border-[#0e0f0c]/10 py-4 last:border-b-0">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e2f6d5] text-[#2f9e0c]">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-[#0e0f0c]">{row.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-[#868685]">{row.helper}</p>
                </div>
              </div>
              {comparisonColumns.map((column) => (
                <div key={`${row.title}-${column.type}`} className="flex justify-center">
                  {row.values[column.type] ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2f9e0c] text-white">
                      <Check className="h-5 w-5" />
                    </span>
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center text-[#a5a7a2]">
                      <X className="h-5 w-5" />
                    </span>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <div className="mt-6 rounded-[18px] border border-[#9fe870] bg-[#f7fdf2] p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e2f6d5] text-[#2f9e0c]">
            <Lightbulb className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-base font-black text-[#163300]">升级建议</h3>
            <p className="mt-2 text-sm leading-6 text-[#454745]">如果你希望发布应用，建议至少升级为独立开发者；团队或企业适合多人协作与品牌化发布。</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function MembershipPlanCard({
  plan,
  selected,
  disabled,
  loading,
  onSubmit
}: {
  plan: IdentityPlan
  selected: boolean
  disabled: boolean
  loading: boolean
  onSubmit: () => void
}) {
  return (
    <article
      className={`flex min-h-[520px] flex-col rounded-[24px] border bg-white p-6 shadow-[rgba(14,15,12,0.12)_0_0_0_1px] transition duration-300 hover:-translate-y-1 hover:border-[#9fe870] ${
        plan.highlighted ? 'border-[#9fe870] ring-1 ring-[#9fe870]' : 'border-[#0e0f0c]/10'
      }`}
    >
      <div className="flex min-h-16 items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-[#0e0f0c]">{plan.title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#868685]">{plan.subtitle}</p>
        </div>
        {plan.badge ? <span className="rounded-full bg-[#e2f6d5] px-3 py-1 text-xs font-black text-[#163300]">{plan.badge}</span> : null}
      </div>

      <div className="mt-7">
        <div className="flex items-end gap-2">
          <p className="text-4xl font-black text-[#0e0f0c]">{plan.priceLabel}</p>
        </div>
        <p className="mt-2 text-sm font-semibold text-[#454745]">{plan.periodLabel}</p>
      </div>

      <p className="mt-5 text-sm leading-6 text-[#454745]">{plan.description}</p>

      <ul className="mt-6 flex-1 space-y-3 text-sm leading-6 text-[#454745]">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-3">
            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#9fe870] text-[#163300]">
              <BadgeCheck className="h-3.5 w-3.5" />
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {plan.freeTierEnabled ? <p className="mt-6 text-xs font-black uppercase text-[#2f9e0c]">包含 Free 层级</p> : null}
      <button type="button" onClick={onSubmit} disabled={disabled || loading} className="btn mt-4 w-full">
        {loading ? '提交中...' : selected ? '当前身份' : plan.ctaLabel}
      </button>
    </article>
  )
}
