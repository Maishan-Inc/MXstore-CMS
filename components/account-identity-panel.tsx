'use client'

import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  Download,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
  type LucideIcon
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { AccountSummary, IdentityPlanTier } from '@/lib/account'
import { canUpgradeTo, getIdentityPlanStatusLabel, isIdentityMembershipFrozen } from '@/lib/account'
import { finishActionFeedback, startActionFeedback } from '@/components/action-feedback'
import type { IdentityPlanSettings, IdentityPlanType } from '@/lib/identity-plans'

type SubmitState = {
  loading: boolean
  message: string | null
}

type SimpleIdentityType = 'personal' | 'independent_developer'
type OrganizationIdentityType = 'enterprise' | 'team_studio'

type TierCard = {
  tier: IdentityPlanTier
  title: string
  badge: string
  price: string
  period: string
  description: string
  features: string[]
}

const initialSubmitStates: Record<IdentityPlanType, SubmitState> = {
  personal: { loading: false, message: null },
  independent_developer: { loading: false, message: null },
  team_studio: { loading: false, message: null },
  enterprise: { loading: false, message: null }
}

const identityCards: Array<{
  type: IdentityPlanType
  title: string
  subtitle: string
  icon: LucideIcon
  targetId: string
}> = [
  { type: 'personal', title: '个人用户', subtitle: '下载、收藏、管理个人权益', icon: UserRound, targetId: 'personal-plans' },
  { type: 'independent_developer', title: '独立开发者', subtitle: '个人开发者发布应用', icon: Sparkles, targetId: 'developer-plans' },
  { type: 'enterprise', title: '企业用户', subtitle: '企业主体认证与分发', icon: Building2, targetId: 'enterprise-plans' },
  { type: 'team_studio', title: '团队工作室', subtitle: '团队资料与多人协作', icon: Users, targetId: 'team-plans' }
]

const durationOptions = [
  { label: '30 天', days: 30 },
  { label: '90 天', days: 90 },
  { label: '365 天', days: 365 }
]

const personalTiers: TierCard[] = [
  {
    tier: 'free',
    title: 'Free',
    badge: '基础',
    price: '￥0',
    period: '个人基础层级',
    description: '适合注册后体验应用下载、订单和流量管理。',
    features: ['浏览公开应用', '基础下载记录', '个人订单管理', '基础流量权益', '可随时升级']
  },
  {
    tier: 'plus',
    title: 'Plus',
    badge: '常用',
    price: '￥19',
    period: '每月',
    description: '适合有稳定下载需求的个人用户。',
    features: ['更高下载流量', '优先下载入口', '应用收藏扩展', '订单与流量明细', '基础支持']
  },
  {
    tier: 'pro',
    title: 'Pro',
    badge: '进阶',
    price: '￥49',
    period: '每月',
    description: '适合重度下载、测试多平台应用的个人用户。',
    features: ['高频下载额度', '下载历史长期保留', '更多设备使用场景', '快速支持', '会员权益优先开放']
  },
  {
    tier: 'max',
    title: 'Max',
    badge: '最高',
    price: '￥99',
    period: '每月',
    description: '适合需要最大个人下载权益和优先支持的用户。',
    features: ['最高个人流量池', '高优先级下载', '优先体验新功能', '专属支持入口', '更高并发下载策略']
  }
]

const developerTiers: TierCard[] = [
  {
    tier: 'free',
    title: 'Free',
    badge: '发布入门',
    price: '￥0',
    period: '开发者基础层级',
    description: '适合独立开发者创建资料并发布少量应用。',
    features: ['开发者头像与名称', '少量应用发布', '基础下载链接管理', '基础分发流量', '应用草稿管理']
  },
  {
    tier: 'plus',
    title: 'Plus',
    badge: '推荐发布',
    price: '￥39',
    period: '每月',
    description: '适合持续发布应用并维护版本的个人开发者。',
    features: ['更多应用发布额度', '版本与下载链接扩展', '开发者展示增强', '分发流量提升', '基础数据统计']
  },
  {
    tier: 'pro',
    title: 'Pro',
    badge: '增长',
    price: '￥99',
    period: '每月',
    description: '适合拥有多个产品线和持续分发需求的开发者。',
    features: ['多应用矩阵管理', '更高分发流量', '应用数据统计', '优先审核支持', '付费应用能力增强']
  },
  {
    tier: 'max',
    title: 'Max',
    badge: '专业',
    price: '￥199',
    period: '每月',
    description: '适合高频发布、需要更高分发权益的专业开发者。',
    features: ['最高独立开发者额度', '优先分发资源', '高级数据分析', '专属支持入口', '品牌化开发者展示']
  }
]

const organizationTiers: TierCard[] = [
  {
    tier: 'free',
    title: 'Free',
    badge: '1-20 人',
    price: '￥0',
    period: '团队基础层级',
    description: '适合小团队创建组织资料并完成 KYC。',
    features: ['1-20 人规模', '组织资料保留', '团队名称展示', 'KYC 待审核流程', '基础协作权益']
  },
  {
    tier: 'plus',
    title: 'Plus',
    badge: '20-50 人',
    price: '￥299',
    period: '每月',
    description: '适合中小团队或企业进入正式协作分发。',
    features: ['20-50 人规模', '组织发布应用', '更高分发流量', '认证资料管理', '标准支持']
  },
  {
    tier: 'pro',
    title: 'Pro',
    badge: '50-100 人',
    price: '￥599',
    period: '每月',
    description: '适合多成员、多应用、多版本的正式分发团队。',
    features: ['50-100 人规模', '更高发布额度', '高级分发能力', '团队数据统计', '优先支持']
  },
  {
    tier: 'max',
    title: 'Max',
    badge: '100 人以上',
    price: '联系我们',
    period: '定制支持',
    description: '适合超过 100 人的企业或团队，需要联系支持团队定制。',
    features: ['100 人以上规模', '定制权益', '专属支持团队', '高级安全与审核', '企业级分发方案']
  }
]

const comparisonRows: Array<{
  type: IdentityPlanType
  label: string
  scope: string
  values: string[]
}> = [
  {
    type: 'personal',
    label: '个人用户',
    scope: '个人下载与使用',
    values: ['Free / Plus / Pro / Max', '下载公开应用', '个人订单与流量', '不能发布应用', '无需 KYC', '无团队成员', '可升级为开发者', '到期后冻结高级权益']
  },
  {
    type: 'independent_developer',
    label: '独立开发者',
    scope: '个人开发者发布',
    values: ['Free / Plus / Pro / Max', '发布个人应用', '开发者头像展示', '下载链接管理', '无需企业 KYC', '无团队成员', '支持付费应用', '到期后冻结发布能力']
  },
  {
    type: 'enterprise',
    label: '企业用户',
    scope: '企业主体分发',
    values: ['Plus / Pro / Max', '企业名称发布', '企业 KYC 必需', '营业执照与身份证材料', '企业认证审核', '20 人以上团队', '正式商业分发', '过期需续费或降级']
  },
  {
    type: 'team_studio',
    label: '团队工作室',
    scope: '团队协作发布',
    values: ['Free / Plus / Pro / Max', '团队名称发布', '团队 KYC 必需', '公开邮箱与私密邮箱', '团队资料审核', '1-100 人规模', '多人协作分发', '过期需续费或降级']
  }
]

const comparisonColumns = ['套餐层级', '核心能力', '主体展示', '资料要求', '审核方式', '成员规模', '发布能力', '到期策略']

export function AccountIdentityPanel({ user, settings }: { user: AccountSummary; settings: IdentityPlanSettings }) {
  const router = useRouter()
  const [states, setStates] = useState<Record<IdentityPlanType, SubmitState>>(initialSubmitStates)
  const [durationDays, setDurationDays] = useState(365)
  const [activeDetail, setActiveDetail] = useState<OrganizationIdentityType | null>(null)
  const [teamTier, setTeamTier] = useState<IdentityPlanTier>('free')
  const [enterpriseTier, setEnterpriseTier] = useState<IdentityPlanTier>('plus')
  const [teamName, setTeamName] = useState(user.organization_name ?? '')
  const [teamPublicEmail, setTeamPublicEmail] = useState(user.identity_public_email ?? '')
  const [teamPrivateEmail, setTeamPrivateEmail] = useState(user.identity_private_email ?? '')
  const [enterpriseName, setEnterpriseName] = useState(user.organization_name ?? '')
  const [enterpriseNote, setEnterpriseNote] = useState(user.enterprise_certification_note ?? '')

  const expiresAt = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() + durationDays)
    return date
  }, [durationDays])

  async function submitAccountType(accountType: IdentityPlanType, payload: Record<string, string>) {
    setStates((current) => ({ ...current, [accountType]: { loading: true, message: null } }))
    startActionFeedback()
    try {
      const response = await fetch('/api/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_type: accountType,
          identity_plan_expires_at: expiresAt.toISOString(),
          ...payload
        })
      })
      if (!response.ok) throw new Error(await response.text())
      setStates((current) => ({ ...current, [accountType]: { loading: false, message: '已更新' } }))
      router.refresh()
      finishActionFeedback('账户身份提交成功')
    } catch (error) {
      const message = error instanceof Error ? error.message : '提交失败'
      setStates((current) => ({ ...current, [accountType]: { loading: false, message } }))
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

  function scrollTo(id: string) {
    window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
  }

  function chooseIdentity(type: IdentityPlanType, targetId: string) {
    if (type === 'team_studio' || type === 'enterprise') {
      setActiveDetail(type)
      scrollTo(`${targetId}-detail`)
      return
    }

    scrollTo(targetId)
  }

  function submitSimpleTier(type: SimpleIdentityType, tier: IdentityPlanTier) {
    const state = cardState(type)
    if (!state.allowed || state.selected) return

    const developerName = user.display_name ?? user.email ?? 'MXStore 用户'
    void submitAccountType(type, {
      identity_plan_tier: tier,
      developer_name: developerName,
      developer_avatar_url: user.avatar_url ?? ''
    })
  }

  function selectOrganizationTier(type: OrganizationIdentityType, tier: IdentityPlanTier) {
    if (type === 'enterprise') {
      if (tier === 'free') return
      setEnterpriseTier(tier)
      setActiveDetail('enterprise')
      scrollTo('enterprise-plans-detail')
      return
    }

    setTeamTier(tier)
    setActiveDetail('team_studio')
    scrollTo('team-plans-detail')
  }

  function submitTeam() {
    const missing = !teamName.trim() || !teamPublicEmail.trim() || !teamPrivateEmail.trim()
    if (missing) {
      setStates((current) => ({
        ...current,
        team_studio: { loading: false, message: '请填写团队名称、公开邮箱和私密邮箱' }
      }))
      return
    }

    void submitAccountType('team_studio', {
      identity_plan_tier: teamTier,
      organization_name: teamName.trim(),
      identity_public_email: teamPublicEmail.trim(),
      identity_private_email: teamPrivateEmail.trim(),
      developer_name: user.display_name ?? user.email ?? teamName.trim(),
      developer_avatar_url: user.avatar_url ?? ''
    })
  }

  function submitEnterprise() {
    if (!enterpriseName.trim() || !enterpriseNote.trim()) {
      setStates((current) => ({
        ...current,
        enterprise: { loading: false, message: '请填写公司名称和认证材料说明' }
      }))
      return
    }

    void submitAccountType('enterprise', {
      identity_plan_tier: enterpriseTier,
      organization_name: enterpriseName.trim(),
      developer_name: enterpriseName.trim(),
      developer_avatar_url: user.avatar_url ?? '',
      enterprise_certification_note: enterpriseNote.trim()
    })
  }

  return (
    <div className="space-y-12">
      <CurrentMembershipSummary user={user} />

      <section className="grid gap-4 xl:grid-cols-4">
        {identityCards.map((card) => {
          const Icon = card.icon
          const state = cardState(card.type)
          const plan = settings.plans[card.type]
          return (
            <article
              key={card.type}
              className="group flex min-h-[286px] flex-col rounded-[24px] border border-[#0e0f0c]/10 bg-white p-6 shadow-[0_18px_42px_rgba(14,15,12,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[rgb(22,51,0)] hover:shadow-[0_22px_48px_rgba(22,51,0,0.12)] focus-within:border-[rgb(22,51,0)]"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f2f5ed] text-[#454745] transition duration-300 group-hover:bg-[#e2f6d5] group-hover:text-[rgb(22,51,0)]">
                  <Icon className="h-8 w-8" />
                </span>
                {state.selected ? <span className="rounded-full bg-[#e2f6d5] px-3 py-1 text-xs font-black text-[rgb(22,51,0)]">当前身份</span> : null}
              </div>
              <h2 className="mt-6 text-2xl font-black text-[#0e0f0c]">{card.title}</h2>
              <p className="mt-2 text-sm font-semibold text-[#454745]">{card.subtitle}</p>
              <p className="mt-4 flex-1 text-sm leading-6 text-[#868685]">{plan.note}</p>
              <button
                type="button"
                onClick={() => chooseIdentity(card.type, card.targetId)}
                disabled={!state.allowed && !state.selected}
                className="btn mt-5 w-full"
              >
                {state.selected ? '查看当前套餐' : `选择${card.title}`}
              </button>
            </article>
          )
        })}
      </section>

      <BenefitsTable />

      <MembershipDateControl durationDays={durationDays} expiresAt={expiresAt} onDurationChange={setDurationDays} />

      <TierSection
        id="personal-plans"
        title="个人用户"
        subtitle="面向个人下载、使用和权益管理。选择套餐后会保存会员到期日期，到期后高级权益冻结，身份层级仍保留。"
        tiers={personalTiers}
        selectedTier={user.account_type === 'personal' ? user.identity_plan_tier : undefined}
        loading={states.personal.loading}
        message={states.personal.message}
        actionPrefix="选择"
        onSelect={(tier) => submitSimpleTier('personal', tier)}
      />

      <TierSection
        id="developer-plans"
        title="独立开发者"
        subtitle="面向个人开发者发布应用。价格、发布额度和分发权益不同于个人用户套餐。"
        tiers={developerTiers}
        selectedTier={user.account_type === 'independent_developer' ? user.identity_plan_tier : undefined}
        loading={states.independent_developer.loading}
        message={states.independent_developer.message}
        actionPrefix="选择"
        onSelect={(tier) => submitSimpleTier('independent_developer', tier)}
      />

      <OrganizationTierSection
        id="enterprise-plans"
        title="企业用户"
        subtitle="企业用户需要选择 Plus 及以上套餐，并在邮箱与 KYC 页面补充企业主体材料、营业执照和邮箱验证码。"
        identityType="enterprise"
        selectedTier={enterpriseTier}
        currentTier={user.account_type === 'enterprise' ? user.identity_plan_tier : undefined}
        activeDetail={activeDetail === 'enterprise'}
        loading={states.enterprise.loading}
        message={states.enterprise.message}
        enterpriseName={enterpriseName}
        enterpriseNote={enterpriseNote}
        expiresAt={expiresAt}
        onEnterpriseNameChange={setEnterpriseName}
        onEnterpriseNoteChange={setEnterpriseNote}
        onSelectTier={(tier) => selectOrganizationTier('enterprise', tier)}
        onSubmit={submitEnterprise}
      />

      <OrganizationTierSection
        id="team-plans"
        title="团队工作室"
        subtitle="团队工作室可选择 Free 起步，需填写公开邮箱、私密邮箱和团队名称，并完成邮箱验证码与 KYC 审核。"
        identityType="team_studio"
        selectedTier={teamTier}
        currentTier={user.account_type === 'team_studio' ? user.identity_plan_tier : undefined}
        activeDetail={activeDetail === 'team_studio'}
        loading={states.team_studio.loading}
        message={states.team_studio.message}
        teamName={teamName}
        teamPublicEmail={teamPublicEmail}
        teamPrivateEmail={teamPrivateEmail}
        expiresAt={expiresAt}
        onTeamNameChange={setTeamName}
        onTeamPublicEmailChange={setTeamPublicEmail}
        onTeamPrivateEmailChange={setTeamPrivateEmail}
        onSelectTier={(tier) => selectOrganizationTier('team_studio', tier)}
        onSubmit={submitTeam}
      />
    </div>
  )
}

function CurrentMembershipSummary({ user }: { user: AccountSummary }) {
  const frozen = isIdentityMembershipFrozen(user)
  const expiresAt = user.identity_plan_expires_at ? new Date(user.identity_plan_expires_at).toLocaleDateString('zh-CN') : '未设置'

  return (
    <section className="grid gap-3 md:grid-cols-4">
      <StatusPill label="当前套餐" value={user.identity_plan_tier.toUpperCase()} />
      <StatusPill label="会员状态" value={frozen ? '冻结中' : getIdentityPlanStatusLabel(user.identity_plan_status)} tone={frozen ? 'warning' : 'normal'} />
      <StatusPill label="会员到期" value={expiresAt} />
      <StatusPill label="KYC 状态" value={kycLabel(user.kyc_status)} />
    </section>
  )
}

function StatusPill({ label, value, tone = 'normal' }: { label: string; value: string; tone?: 'normal' | 'warning' }) {
  return (
    <div className="rounded-[20px] border border-[#0e0f0c]/10 bg-white px-5 py-4 shadow-[rgba(14,15,12,0.12)_0_0_0_1px]">
      <p className="text-xs font-semibold text-[#868685]">{label}</p>
      <p className={`mt-1 text-sm font-black ${tone === 'warning' ? 'text-amber-700' : 'text-[#0e0f0c]'}`}>{value}</p>
    </div>
  )
}

function BenefitsTable() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-[#0e0f0c]">身份权益对比</h2>
        <p className="mt-2 text-sm leading-6 text-[#868685]">左侧按身份类型排列，横向展示各身份的套餐、资料、发布能力、KYC 和到期策略。</p>
      </div>
      <div className="overflow-x-auto rounded-[24px] border border-[#0e0f0c]/10 bg-white shadow-[0_18px_42px_rgba(14,15,12,0.06)]">
        <table className="min-w-[1160px] text-left text-sm">
          <thead className="border-b border-[#0e0f0c]/10 bg-[#f7f8f2] text-[#454745]">
            <tr>
              <th className="px-5 py-4 font-black">身份类型</th>
              {comparisonColumns.map((column) => (
                <th key={column} className="px-4 py-4 font-black">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0e0f0c]/10">
            {comparisonRows.map((row) => (
              <tr key={row.type} className="align-top">
                <th className="px-5 py-5">
                  <p className="text-base font-black text-[#0e0f0c]">{row.label}</p>
                  <p className="mt-1 text-xs font-semibold text-[#868685]">{row.scope}</p>
                </th>
                {row.values.map((value) => (
                  <td key={value} className="px-4 py-5 leading-6 text-[#454745]">{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function MembershipDateControl({
  durationDays,
  expiresAt,
  onDurationChange
}: {
  durationDays: number
  expiresAt: Date
  onDurationChange: (days: number) => void
}) {
  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-[#0e0f0c]/10 bg-white p-5 shadow-[rgba(14,15,12,0.12)_0_0_0_1px]">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e2f6d5] text-[rgb(22,51,0)]">
          <CalendarDays className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-black text-[#0e0f0c]">会员日期</h2>
          <p className="mt-1 text-sm text-[#868685]">选择套餐时会写入到期日期：{expiresAt.toLocaleDateString('zh-CN')}</p>
        </div>
      </div>
      <select value={durationDays} onChange={(event) => onDurationChange(Number(event.target.value))} className="input max-w-44">
        {durationOptions.map((option) => (
          <option key={option.days} value={option.days}>{option.label}</option>
        ))}
      </select>
    </section>
  )
}

function TierSection({
  id,
  title,
  subtitle,
  tiers,
  selectedTier,
  loading,
  message,
  actionPrefix,
  onSelect
}: {
  id: string
  title: string
  subtitle: string
  tiers: TierCard[]
  selectedTier?: IdentityPlanTier
  loading: boolean
  message: string | null
  actionPrefix: string
  onSelect: (tier: IdentityPlanTier) => void
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5">
      <SectionHeading title={title} subtitle={subtitle} message={message} />
      <div className="grid gap-4 xl:grid-cols-4">
        {tiers.map((tier) => (
          <PlanCard
            key={tier.tier}
            tier={tier}
            selected={selectedTier === tier.tier}
            loading={loading}
            buttonText={selectedTier === tier.tier ? '当前套餐' : `${actionPrefix}${tier.title}`}
            onSelect={() => onSelect(tier.tier)}
          />
        ))}
      </div>
    </section>
  )
}

function OrganizationTierSection({
  id,
  title,
  subtitle,
  identityType,
  selectedTier,
  currentTier,
  activeDetail,
  loading,
  message,
  teamName,
  teamPublicEmail,
  teamPrivateEmail,
  enterpriseName,
  enterpriseNote,
  expiresAt,
  onTeamNameChange,
  onTeamPublicEmailChange,
  onTeamPrivateEmailChange,
  onEnterpriseNameChange,
  onEnterpriseNoteChange,
  onSelectTier,
  onSubmit
}: {
  id: string
  title: string
  subtitle: string
  identityType: OrganizationIdentityType
  selectedTier: IdentityPlanTier
  currentTier?: IdentityPlanTier
  activeDetail: boolean
  loading: boolean
  message: string | null
  teamName?: string
  teamPublicEmail?: string
  teamPrivateEmail?: string
  enterpriseName?: string
  enterpriseNote?: string
  expiresAt: Date
  onTeamNameChange?: (value: string) => void
  onTeamPublicEmailChange?: (value: string) => void
  onTeamPrivateEmailChange?: (value: string) => void
  onEnterpriseNameChange?: (value: string) => void
  onEnterpriseNoteChange?: (value: string) => void
  onSelectTier: (tier: IdentityPlanTier) => void
  onSubmit: () => void
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5">
      <SectionHeading title={title} subtitle={subtitle} message={message} />
      <div className="grid gap-4 xl:grid-cols-4">
        {organizationTiers.map((tier) => {
          const enterpriseFreeDisabled = identityType === 'enterprise' && tier.tier === 'free'
          const contactOnly = tier.tier === 'max'
          return (
            <PlanCard
              key={tier.tier}
              tier={tier}
              selected={(currentTier ?? selectedTier) === tier.tier}
              disabled={enterpriseFreeDisabled || contactOnly}
              loading={loading}
              buttonText={enterpriseFreeDisabled ? '企业不可选 Free' : contactOnly ? '联系团队' : `选择${tier.title}`}
              onSelect={() => onSelectTier(tier.tier)}
            />
          )
        })}
      </div>

      <div id={`${id}-detail`} className="scroll-mt-24">
        {activeDetail ? (
          <section className="rounded-[24px] border border-[#0e0f0c]/10 bg-white p-6 shadow-[0_18px_42px_rgba(14,15,12,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-[#0e0f0c]">{title}资料填写</h3>
                <p className="mt-2 text-sm leading-6 text-[#868685]">
                  当前选择：{selectedTier.toUpperCase()}，会员到期：{expiresAt.toLocaleDateString('zh-CN')}。提交后进入 KYC 待审核状态，请到邮箱与 KYC 页面完成验证码和材料上传。
                </p>
              </div>
              <span className="rounded-full bg-[#e2f6d5] px-4 py-2 text-sm font-black text-[rgb(22,51,0)]">KYC 待验证</span>
            </div>

            {identityType === 'team_studio' ? (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <label>
                  <span className="label">团队名称</span>
                  <input value={teamName} onChange={(event) => onTeamNameChange?.(event.target.value)} className="input" placeholder="团队或工作室名称" />
                </label>
                <label>
                  <span className="label">公开邮箱地址</span>
                  <input value={teamPublicEmail} onChange={(event) => onTeamPublicEmailChange?.(event.target.value)} className="input" placeholder="public@example.com" />
                </label>
                <label>
                  <span className="label">私密邮箱地址</span>
                  <input value={teamPrivateEmail} onChange={(event) => onTeamPrivateEmailChange?.(event.target.value)} className="input" placeholder="private@example.com" />
                </label>
                <div className="rounded-[18px] border border-dashed border-[#0e0f0c]/15 bg-[#f7f8f2] p-4 text-sm leading-6 text-[#5f625d] md:col-span-3">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 text-[rgb(22,51,0)]" />
                    <p>提交后请到邮箱与 KYC 页面发送公开邮箱和私密邮箱验证码。</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="label">公司名称</span>
                  <input value={enterpriseName} onChange={(event) => onEnterpriseNameChange?.(event.target.value)} className="input" placeholder="营业执照上的公司名称" />
                </label>
                <label>
                  <span className="label">认证材料说明</span>
                  <input value={enterpriseNote} onChange={(event) => onEnterpriseNoteChange?.(event.target.value)} className="input" placeholder="统一社会信用代码、联系人、认证邮箱等" />
                </label>
                <div className="rounded-[18px] border border-dashed border-[#0e0f0c]/15 bg-[#f7f8f2] p-4 text-sm leading-6 text-[#5f625d] md:col-span-2">
                  <div className="flex items-start gap-3">
                    <LockKeyhole className="mt-0.5 h-5 w-5 text-[rgb(22,51,0)]" />
                    <p>企业需要在邮箱与 KYC 页面上传营业执照，并等待管理员后台审核。</p>
                  </div>
                </div>
              </div>
            )}

            <button type="button" onClick={onSubmit} disabled={loading} className="btn mt-6">
              {loading ? '提交中...' : `提交${title}资料`}
            </button>
          </section>
        ) : (
          <section className="rounded-[24px] border border-dashed border-[#0e0f0c]/15 bg-white/70 p-6 text-sm leading-6 text-[#5f625d]">
            选择上方套餐后会在这里显示{title}资料填写页面。
          </section>
        )}
      </div>
    </section>
  )
}

function PlanCard({
  tier,
  selected,
  disabled = false,
  loading,
  buttonText,
  onSelect
}: {
  tier: TierCard
  selected: boolean
  disabled?: boolean
  loading: boolean
  buttonText: string
  onSelect: () => void
}) {
  return (
    <article className="flex min-h-[460px] flex-col rounded-[24px] border border-[#0e0f0c]/10 bg-white p-6 shadow-[rgba(14,15,12,0.12)_0_0_0_1px] transition duration-300 hover:-translate-y-1 hover:border-[rgb(22,51,0)] focus-within:border-[rgb(22,51,0)]">
      <div className="flex min-h-16 items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-[#0e0f0c]">{tier.title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#868685]">{tier.description}</p>
        </div>
        <span className="rounded-full bg-[#e2f6d5] px-3 py-1 text-xs font-black text-[rgb(22,51,0)]">{tier.badge}</span>
      </div>

      <div className="mt-7">
        <p className="text-4xl font-black text-[#0e0f0c]">{tier.price}</p>
        <p className="mt-2 text-sm font-semibold text-[#454745]">{tier.period}</p>
      </div>

      <ul className="mt-6 flex-1 space-y-3 text-sm leading-6 text-[#454745]">
        {tier.features.map((feature) => (
          <li key={feature} className="flex gap-3">
            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#9fe870] text-[rgb(22,51,0)]">
              <BadgeCheck className="h-3.5 w-3.5" />
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {selected ? <p className="mt-5 text-xs font-black uppercase text-[rgb(22,51,0)]">当前选择</p> : null}
      <button type="button" onClick={onSelect} disabled={disabled || loading || selected} className="btn mt-4 w-full">
        {loading ? '处理中...' : buttonText}
      </button>
    </article>
  )
}

function SectionHeading({ title, subtitle, message }: { title: string; subtitle: string; message: string | null }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-black text-[#0e0f0c]">{title}</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-[#868685]">{subtitle}</p>
      </div>
      {message ? <p className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">{message}</p> : null}
    </div>
  )
}

function kycLabel(status: AccountSummary['kyc_status']) {
  if (status === 'pending') return '待审核'
  if (status === 'verified') return '已通过'
  if (status === 'rejected') return '未通过'
  if (status === 'needs_more_info') return '需补充'
  return '无需验证'
}
