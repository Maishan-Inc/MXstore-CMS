export type AccountType = 'unselected' | 'personal' | 'independent_developer' | 'team_studio' | 'enterprise'
export type EnterpriseCertificationStatus = 'not_required' | 'pending' | 'verified' | 'rejected' | 'needs_more_info'
export type TeamPlanStatus = 'none' | 'pending' | 'active' | 'expired'
export type IdentityPlanTier = 'free' | 'plus' | 'pro' | 'max'
export type IdentityPlanStatus = 'none' | 'active' | 'pending_kyc' | 'expired' | 'frozen'
export type KycStatus = 'not_required' | 'pending' | 'verified' | 'rejected' | 'needs_more_info'

export type AccountSummary = {
  role: 'user' | 'admin'
  account_type: AccountType
  enterprise_certification_status: EnterpriseCertificationStatus
  team_plan_status: TeamPlanStatus
  organization_name: string | null
  developer_name: string | null
  developer_avatar_url: string | null
  display_name: string | null
  email: string | null
  avatar_url: string | null
  enterprise_certification_note: string | null
  identity_public_email: string | null
  identity_private_email: string | null
  identity_plan_tier: IdentityPlanTier
  identity_plan_status: IdentityPlanStatus
  identity_plan_started_at: string | null
  identity_plan_expires_at: string | null
  kyc_status: KycStatus
  kyc_note: string | null
}

const accountRank: Record<AccountType, number> = {
  unselected: 0,
  personal: 1,
  independent_developer: 2,
  team_studio: 3,
  enterprise: 4
}

const accountTypeLabels: Record<AccountType, string> = {
  unselected: '待选择身份',
  personal: '个人用户',
  independent_developer: '独立开发者',
  team_studio: '团队工作室',
  enterprise: '企业用户'
}

export function getAccountTypeLabel(type: AccountType) {
  return accountTypeLabels[type]
}

export function getAccountTypeDescription(type: AccountType) {
  if (type === 'personal') return '只能使用和下载，升级后才能发布应用。'
  if (type === 'independent_developer') return '可发布个人开发者应用，并显示开发者头像与名称。'
  if (type === 'team_studio') return '适用于团队账号，需要先开通团队版套餐。'
  if (type === 'enterprise') return '适用于企业主体，需完成企业认证后才能继续使用发布能力。'
  return '请选择你的账号身份，后续不可降级。'
}

export function getEnterpriseStatusLabel(status: EnterpriseCertificationStatus) {
  if (status === 'verified') return '已认证'
  if (status === 'pending') return '审核中'
  if (status === 'rejected') return '认证未通过'
  if (status === 'needs_more_info') return '补充材料'
  return '无需认证'
}

export function getTeamPlanLabel(status: TeamPlanStatus) {
  if (status === 'active') return '已开通'
  if (status === 'pending') return '待开通'
  if (status === 'expired') return '已过期'
  return '未开通'
}

export function getIdentityPlanStatusLabel(status: IdentityPlanStatus) {
  if (status === 'active') return '有效'
  if (status === 'pending_kyc') return 'KYC 待审核'
  if (status === 'expired') return '已过期'
  if (status === 'frozen') return '冻结中'
  return '未选择'
}

export function isIdentityMembershipFrozen(user: Pick<AccountSummary, 'identity_plan_status' | 'identity_plan_expires_at'>) {
  if (user.identity_plan_status === 'frozen' || user.identity_plan_status === 'expired') return true
  if (!user.identity_plan_expires_at) return false
  return new Date(user.identity_plan_expires_at).getTime() < Date.now()
}

export function canPublishApps(user: Pick<AccountSummary, 'role' | 'account_type' | 'enterprise_certification_status' | 'team_plan_status' | 'identity_plan_status' | 'identity_plan_expires_at'>) {
  if (user.role === 'admin') return true
  if (isIdentityMembershipFrozen(user)) return false
  if (user.account_type === 'independent_developer') return user.identity_plan_status === 'active'
  if (user.account_type === 'team_studio') return user.team_plan_status === 'active' && user.identity_plan_status === 'active'
  if (user.account_type === 'enterprise') return user.enterprise_certification_status === 'verified' && user.identity_plan_status === 'active'
  return false
}

export function canUpgradeTo(currentType: AccountType, nextType: AccountType) {
  return accountRank[nextType] >= accountRank[currentType]
}

export function getNextRouteForUser(user: Pick<AccountSummary, 'role' | 'account_type' | 'enterprise_certification_status' | 'team_plan_status'>) {
  if (user.role === 'admin') return '/admin'
  if (user.account_type === 'unselected') return '/onboarding'
  return '/dashboard'
}

export function getDeveloperProfile(user: AccountSummary) {
  if (user.account_type === 'enterprise' || user.account_type === 'team_studio') {
    return {
      name: user.organization_name ?? user.display_name ?? user.email ?? '团队主体',
      avatarUrl: user.developer_avatar_url ?? user.avatar_url
    }
  }

  return {
    name: user.developer_name ?? user.display_name ?? user.email ?? '开发者',
    avatarUrl: user.developer_avatar_url ?? user.avatar_url
  }
}
