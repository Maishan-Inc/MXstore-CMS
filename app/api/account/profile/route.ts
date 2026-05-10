import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { canUpgradeTo, getNextRouteForUser } from '@/lib/account'

const AccountTypeSchema = z.enum(['personal', 'independent_developer', 'team_studio', 'enterprise'])
const IdentityPlanTierSchema = z.enum(['free', 'plus', 'pro', 'max'])

const ProfileSchema = z.object({
  account_type: AccountTypeSchema,
  display_name: z.string().trim().min(1).max(120).optional(),
  developer_name: z.string().trim().min(1).max(120).optional(),
  organization_name: z.string().trim().min(1).max(160).optional(),
  developer_avatar_url: z.string().url().optional().or(z.literal('')).optional(),
  enterprise_certification_note: z.string().trim().max(1000).optional(),
  identity_public_email: z.string().trim().email().optional(),
  identity_private_email: z.string().trim().email().optional(),
  identity_plan_tier: IdentityPlanTierSchema.default('free'),
  identity_plan_expires_at: z.string().datetime().optional()
}).superRefine((value, ctx) => {
  if (value.account_type === 'independent_developer' && !value.developer_name) {
    ctx.addIssue({ code: 'custom', path: ['developer_name'], message: '请填写开发者名称' })
  }
  if (value.account_type === 'team_studio' && !value.organization_name) {
    ctx.addIssue({ code: 'custom', path: ['organization_name'], message: '请填写团队名称' })
  }
  if (value.account_type === 'team_studio') {
    if (!value.identity_public_email) {
      ctx.addIssue({ code: 'custom', path: ['identity_public_email'], message: '请填写公开邮箱地址' })
    }
    if (!value.identity_private_email) {
      ctx.addIssue({ code: 'custom', path: ['identity_private_email'], message: '请填写私密邮箱地址' })
    }
  }
  if (value.account_type === 'enterprise') {
    if (!value.organization_name) {
      ctx.addIssue({ code: 'custom', path: ['organization_name'], message: '请填写公司名称' })
    }
    if (!value.enterprise_certification_note) {
      ctx.addIssue({ code: 'custom', path: ['enterprise_certification_note'], message: '请填写认证材料说明' })
    }
    if (value.identity_plan_tier === 'free') {
      ctx.addIssue({ code: 'custom', path: ['identity_plan_tier'], message: '企业用户只能选择 Plus 及以上套餐' })
    }
  }
})

export async function POST(request: Request) {
  const user = await requireUser()
  const parsed = ProfileSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return new NextResponse('身份资料无效', { status: 400 })
  }

  if (!canUpgradeTo(user.account_type, parsed.data.account_type)) {
    return new NextResponse('账户身份不能降级', { status: 400 })
  }

  const supabase = createAdminClient()
  const patch: Record<string, string | number | null | undefined> = {
    account_type: parsed.data.account_type,
    identity_plan_tier: parsed.data.identity_plan_tier,
    identity_plan_started_at: new Date().toISOString(),
    identity_plan_expires_at: parsed.data.identity_plan_expires_at ?? null,
    updated_at: new Date().toISOString()
  }

  if (parsed.data.display_name) patch.display_name = parsed.data.display_name
  if (parsed.data.identity_public_email) patch.identity_public_email = parsed.data.identity_public_email
  if (parsed.data.identity_private_email) patch.identity_private_email = parsed.data.identity_private_email

  if (parsed.data.account_type === 'independent_developer') {
    patch.developer_name = parsed.data.developer_name || user.developer_name || user.display_name || user.email
    patch.developer_avatar_url = parsed.data.developer_avatar_url || user.developer_avatar_url || user.avatar_url
    patch.organization_name = null
    patch.enterprise_certification_status = 'not_required'
    patch.enterprise_certification_note = null
    patch.team_plan_status = 'none'
    patch.identity_public_email = null
    patch.identity_private_email = null
    patch.identity_plan_status = 'active'
    patch.kyc_status = 'not_required'
    patch.kyc_note = null
  }

  if (parsed.data.account_type === 'team_studio') {
    patch.organization_name = parsed.data.organization_name || user.organization_name || user.display_name || user.email
    patch.developer_name = parsed.data.developer_name || user.developer_name || user.display_name || user.email
    patch.developer_avatar_url = parsed.data.developer_avatar_url || user.developer_avatar_url || user.avatar_url
    patch.enterprise_certification_status = 'not_required'
    patch.enterprise_certification_note = null
    patch.team_plan_status = user.team_plan_status === 'active' ? 'active' : 'pending'
    patch.identity_plan_status = 'pending_kyc'
    patch.kyc_status = 'pending'
    patch.kyc_note = '团队工作室 KYC：邮箱验证码、资料审核和后台审核功能待接入。'
  }

  if (parsed.data.account_type === 'enterprise') {
    patch.organization_name = parsed.data.organization_name || user.organization_name || user.display_name || user.email
    patch.developer_name = parsed.data.organization_name || user.organization_name || user.display_name || user.email
    patch.developer_avatar_url = parsed.data.developer_avatar_url || user.developer_avatar_url || user.avatar_url
    patch.enterprise_certification_status = user.enterprise_certification_status === 'verified' ? 'verified' : 'pending'
    patch.enterprise_certification_note = parsed.data.enterprise_certification_note ?? user.enterprise_certification_note ?? null
    patch.team_plan_status = 'none'
    patch.identity_public_email = null
    patch.identity_private_email = null
    patch.identity_plan_status = 'pending_kyc'
    patch.kyc_status = 'pending'
    patch.kyc_note = '企业 KYC：营业执照、身份证正反面上传和后台审核功能待接入。'
  }

  if (parsed.data.account_type === 'personal') {
    patch.developer_name = parsed.data.developer_name || user.developer_name || user.display_name || user.email
    patch.developer_avatar_url = parsed.data.developer_avatar_url || user.developer_avatar_url || user.avatar_url
    patch.organization_name = null
    patch.enterprise_certification_status = 'not_required'
    patch.enterprise_certification_note = null
    patch.team_plan_status = 'none'
    patch.identity_public_email = null
    patch.identity_private_email = null
    patch.identity_plan_status = 'active'
    patch.kyc_status = 'not_required'
    patch.kyc_note = null
  }

  const { data, error } = await supabase
    .from('store_users')
    .update(patch)
    .eq('id', user.id)
    .select('id,role,email,display_name,wallet_address,auth_user_id,avatar_url,avatar_source,account_type,developer_name,developer_avatar_url,organization_name,enterprise_certification_status,enterprise_certification_note,team_plan_status,download_quota_bytes,distribution_quota_bytes,distribution_charge_threshold_bytes,identity_public_email,identity_private_email,identity_plan_tier,identity_plan_status,identity_plan_started_at,identity_plan_expires_at,kyc_status,kyc_note')
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json({
    ok: true,
    user: data,
    next: getNextRouteForUser(data)
  })
}
