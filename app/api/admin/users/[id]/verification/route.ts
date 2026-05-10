import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendConfiguredEmail } from '@/lib/smtp'
import { getAccountTypeLabel } from '@/lib/account'

const Schema = z.object({
  action: z.enum(['approve', 'reject', 'needs_more_info']),
  note: z.string().trim().max(1000).optional()
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const parsed = Schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: '审核参数无效' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: user, error: userError } = await supabase
    .from('store_users')
    .select('id,email,display_name,wallet_address,account_type,enterprise_certification_status')
    .eq('id', id)
    .single()
  if (userError) return NextResponse.json({ ok: false, error: userError.message }, { status: 500 })

  const now = new Date().toISOString()
  const isApproved = parsed.data.action === 'approve'
  const isRejected = parsed.data.action === 'reject'
  const status = isApproved ? 'verified' : isRejected ? 'rejected' : 'needs_more_info'
  const patch: Record<string, string | null> = {
    kyc_status: status,
    enterprise_certification_status: user.account_type === 'enterprise' ? status : 'not_required',
    identity_plan_status: isApproved ? 'active' : 'pending_kyc',
    kyc_note: parsed.data.note ?? null,
    enterprise_certification_note: parsed.data.note ?? null,
    updated_at: now
  }
  if (user.account_type === 'team_studio' && isApproved) {
    patch.team_plan_status = 'active'
  }

  const { error: updateError } = await supabase
    .from('store_users')
    .update(patch)
    .eq('id', id)
  if (updateError) return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 })

  let mailError: string | null = null
  if (user.email) {
    try {
      await sendConfiguredEmail(
        isApproved ? 'identity_approved' : isRejected ? 'identity_rejected' : 'identity_needs_more_info',
        user.email,
        {
          name: user.display_name ?? user.email ?? user.wallet_address ?? 'MXStore 用户',
          accountType: getAccountTypeLabel(user.account_type),
          note: parsed.data.note ?? ''
        }
      )
    } catch (error) {
      mailError = error instanceof Error ? error.message : String(error)
    }
  }

  return NextResponse.json({ ok: true, mailError })
}
