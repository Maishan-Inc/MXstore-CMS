import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const Schema = z.object({
  email: z.string().trim().email().nullable().optional(),
  display_name: z.string().trim().max(120).nullable().optional(),
  wallet_address: z.string().trim().max(80).nullable().optional(),
  role: z.enum(['user', 'admin']).optional(),
  account_type: z.enum(['unselected', 'personal', 'independent_developer', 'team_studio', 'enterprise']).optional(),
  developer_name: z.string().trim().max(120).nullable().optional(),
  organization_name: z.string().trim().max(160).nullable().optional(),
  enterprise_certification_status: z.enum(['not_required', 'pending', 'verified', 'rejected', 'needs_more_info']).optional(),
  enterprise_certification_note: z.string().trim().max(1000).nullable().optional(),
  team_plan_status: z.enum(['none', 'pending', 'active', 'expired']).optional(),
  identity_plan_tier: z.enum(['free', 'plus', 'pro', 'max']).optional(),
  identity_plan_status: z.enum(['none', 'active', 'pending_kyc', 'expired', 'frozen']).optional(),
  kyc_status: z.enum(['not_required', 'pending', 'verified', 'rejected', 'needs_more_info']).optional(),
  kyc_note: z.string().trim().max(1000).nullable().optional(),
  download_quota_bytes: z.number().int().min(0).optional(),
  distribution_quota_bytes: z.number().int().min(0).optional(),
  distribution_charge_threshold_bytes: z.number().int().min(0).optional()
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const parsed = Schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: '用户资料无效', detail: parsed.error.flatten() }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('store_users')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ ok: false, error: '用户资料保存失败', detail: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
