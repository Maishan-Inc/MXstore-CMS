import type { AccountType } from '@/lib/account'

export const identityPlanTypes = ['personal', 'independent_developer', 'enterprise', 'team_studio'] as const

export type IdentityPlanType = Exclude<AccountType, 'unselected'>

export type IdentityPlan = {
  type: IdentityPlanType
  title: string
  subtitle: string
  badge: string
  description: string
  note: string
  priceLabel: string
  periodLabel: string
  ctaLabel: string
  features: string[]
  highlighted: boolean
  enabled: boolean
  freeTierEnabled: boolean
  sortOrder: number
}

export type IdentityPlanSettings = {
  pageTitle: string
  pageSubtitle: string
  plans: Record<IdentityPlanType, IdentityPlan>
}

export const defaultIdentityPlanSettings: IdentityPlanSettings = {
  pageTitle: '选择身份',
  pageSubtitle: '根据你的使用场景选择合适的身份类型，后续可随时升级。',
  plans: {
    personal: {
      type: 'personal',
      title: '个人用户',
      subtitle: '下载与个人使用',
      badge: 'Free',
      description: '适合只下载、收藏和管理自己应用权益的用户。',
      note: '个人身份可免费使用基础下载能力，升级后才能发布应用。',
      priceLabel: 'Free',
      periodLabel: '永久免费',
      ctaLabel: '选择个人身份',
      features: ['浏览和下载公开应用', '管理个人订单与流量', '查看下载记录', '可升级为开发者身份'],
      highlighted: false,
      enabled: true,
      freeTierEnabled: true,
      sortOrder: 1
    },
    independent_developer: {
      type: 'independent_developer',
      title: '独立开发者',
      subtitle: '个人开发者发布应用',
      badge: '推荐',
      description: '适合独立开发者上传、发布和维护自己的应用。',
      note: '应用会展示开发者头像与名称，适合个人品牌发布。',
      priceLabel: 'Free',
      periodLabel: '基础发布层级',
      ctaLabel: '选择独立开发者',
      features: ['发布个人开发者应用', '展示开发者头像与名称', '管理应用版本与下载链接', '支持后续购买更多流量'],
      highlighted: false,
      enabled: true,
      freeTierEnabled: true,
      sortOrder: 2
    },
    enterprise: {
      type: 'enterprise',
      title: '企业用户',
      subtitle: '企业主体认证发布',
      badge: '需要企业认证',
      description: '适合以公司主体发布应用并管理企业级分发流程。',
      note: '需要提交企业名称和认证材料说明，审核通过后开放发布能力。',
      priceLabel: '认证后启用',
      periodLabel: '企业方案',
      ctaLabel: '提交企业认证',
      features: ['企业名称发布应用', '企业认证支持', '适合正式商业分发', '可配置更高流量与协作权益'],
      highlighted: false,
      enabled: true,
      freeTierEnabled: false,
      sortOrder: 3
    },
    team_studio: {
      type: 'team_studio',
      title: '团队工作室',
      subtitle: '多人协作发布',
      badge: 'Free',
      description: '适合工作室、团队账号或多人协作的应用发布场景。',
      note: '团队身份可免费创建资料，正式发布前可按需开通团队套餐。',
      priceLabel: 'Free',
      periodLabel: '团队基础层级',
      ctaLabel: '提交团队身份',
      features: ['团队名称发布应用', '适合多人协作与品牌化发布', '保留团队资料与应用归属', '可升级团队版流量套餐'],
      highlighted: false,
      enabled: true,
      freeTierEnabled: true,
      sortOrder: 4
    }
  }
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function textValue(value: unknown, fallback: string, maxLength = 500) {
  if (typeof value !== 'string') return fallback
  const text = value.trim()
  if (!text) return fallback
  return text.slice(0, maxLength)
}

function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function featuresValue(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback
  const features = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12)
  return features.length ? features : fallback
}

function normalizePlan(type: IdentityPlanType, value: unknown): IdentityPlan {
  const fallback = defaultIdentityPlanSettings.plans[type]
  const input = isRecord(value) ? value : {}
  return {
    type,
    title: textValue(input.title, fallback.title, 60),
    subtitle: textValue(input.subtitle, fallback.subtitle, 120),
    badge: typeof input.badge === 'string' ? input.badge.trim().slice(0, 40) : fallback.badge,
    description: textValue(input.description, fallback.description, 500),
    note: textValue(input.note, fallback.note, 500),
    priceLabel: textValue(input.priceLabel, fallback.priceLabel, 40),
    periodLabel: textValue(input.periodLabel, fallback.periodLabel, 60),
    ctaLabel: textValue(input.ctaLabel, fallback.ctaLabel, 40),
    features: featuresValue(input.features, fallback.features),
    highlighted: booleanValue(input.highlighted, fallback.highlighted),
    enabled: booleanValue(input.enabled, fallback.enabled),
    freeTierEnabled: booleanValue(input.freeTierEnabled, fallback.freeTierEnabled),
    sortOrder: numberValue(input.sortOrder, fallback.sortOrder)
  }
}

export function normalizeIdentityPlanSettings(value: unknown): IdentityPlanSettings {
  const input = isRecord(value) ? value : {}
  const plansInput = isRecord(input.plans) ? input.plans : {}

  return {
    pageTitle: textValue(input.pageTitle, defaultIdentityPlanSettings.pageTitle, 80),
    pageSubtitle: textValue(input.pageSubtitle, defaultIdentityPlanSettings.pageSubtitle, 240),
    plans: {
      personal: normalizePlan('personal', plansInput.personal),
      independent_developer: normalizePlan('independent_developer', plansInput.independent_developer),
      enterprise: normalizePlan('enterprise', plansInput.enterprise),
      team_studio: normalizePlan('team_studio', plansInput.team_studio)
    }
  }
}

export function getOrderedIdentityPlans(settings: IdentityPlanSettings) {
  return identityPlanTypes
    .map((type) => settings.plans[type])
    .filter((plan) => plan.enabled)
    .sort((left, right) => left.sortOrder - right.sortOrder)
}
