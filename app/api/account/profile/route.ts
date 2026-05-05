import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { canUpgradeTo, getNextRouteForUser } from '@/lib/account'

const AccountTypeSchema = z.enum(['personal', 'independent_developer', 'team_studio', 'enterprise'])

const ProfileSchema = z.object({
  account_type: AccountTypeSchema,
  display_name: z.string().trim().min(1).max(120).optional(),
  developer_name: z.string().trim().min(1).max(120).optional(),
  organization_name: z.string().trim().min(1).max(160).optional(),
  developer_avatar_url: z.string().url().optional().or(z.literal('')).optional(),
  enterprise_certification_note: z.string().trim().max(500).optional()
}).superRefine((value, ctx) => {
  if (value.account_type === 'independent_developer' && !value.developer_name) {
    ctx.addIssue({ code: 'custom', path: ['developer_name'], message: '请填写开发者名称' })
  }
  if (value.account_type === 'team_studio' && !value.organization_name) {
    ctx.addIssue({ code: 'custom', path: ['organization_name'], message: '请填写团队名称' })
  }
  if (value.account_type === 'enterprise') {
    if (!value.organization_name) {
      ctx.addIssue({ code: 'custom', path: ['organization_name'], message: '请填写公司名称' })
    }
    if (!value.enterprise_certification_note) {
      ctx.addIssue({ code: 'custom', path: ['enterprise_certification_note'], message: '请填写认证材料说明' })
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
    updated_at: new Date().toISOString()
  }

  if (parsed.data.display_name) patch.display_name = parsed.data.display_name

  if (parsed.data.account_type === 'independent_developer') {
    patch.developer_name = parsed.data.developer_name || user.developer_name || user.display_name || user.email
    patch.developer_avatar_url = parsed.data.developer_avatar_url || user.developer_avatar_url || user.avatar_url
    patch.organization_name = null
    patch.enterprise_certification_status = 'not_required'
    patch.enterprise_certification_note = null
    patch.team_plan_status = 'none'
  }

  if (parsed.data.account_type === 'team_studio') {
    patch.organization_name = parsed.data.organization_name || user.organization_name || user.display_name || user.email
    patch.developer_name = parsed.data.developer_name || user.developer_name || user.display_name || user.email
    patch.developer_avatar_url = parsed.data.developer_avatar_url || user.developer_avatar_url || user.avatar_url
    patch.enterprise_certification_status = 'not_required'
    patch.enterprise_certification_note = null
    patch.team_plan_status = user.team_plan_status === 'active' ? 'active' : 'pending'
  }

  if (parsed.data.account_type === 'enterprise') {
    patch.organization_name = parsed.data.organization_name || user.organization_name || user.display_name || user.email
    patch.developer_name = parsed.data.organization_name || user.organization_name || user.display_name || user.email
    patch.developer_avatar_url = parsed.data.developer_avatar_url || user.developer_avatar_url || user.avatar_url
    patch.enterprise_certification_status = user.enterprise_certification_status === 'verified' ? 'verified' : 'pending'
    patch.enterprise_certification_note = parsed.data.enterprise_certification_note ?? user.enterprise_certification_note ?? null
    patch.team_plan_status = 'none'
  }

  if (parsed.data.account_type === 'personal') {
    patch.developer_name = parsed.data.developer_name || user.developer_name || user.display_name || user.email
    patch.developer_avatar_url = parsed.data.developer_avatar_url || user.developer_avatar_url || user.avatar_url
    patch.organization_name = null
    patch.enterprise_certification_status = 'not_required'
    patch.enterprise_certification_note = null
    patch.team_plan_status = 'none'
  }

  const { data, error } = await supabase
    .from('store_users')
    .update(patch)
    .eq('id', user.id)
    .select('id,role,email,display_name,wallet_address,auth_user_id,avatar_url,avatar_source,account_type,developer_name,developer_avatar_url,organization_name,enterprise_certification_status,enterprise_certification_note,team_plan_status,download_quota_bytes,distribution_quota_bytes,distribution_charge_threshold_bytes')
    .single()

  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json({
    ok: true,
    user: data,
    next: getNextRouteForUser(data)
  })
}
