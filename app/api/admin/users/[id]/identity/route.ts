import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const Schema = z.object({
  enterprise_certification_status: z.enum(['not_required', 'pending', 'verified', 'rejected', 'needs_more_info']),
  team_plan_status: z.enum(['none', 'pending', 'active', 'expired']),
  organization_name: z.string().trim().max(160).optional().or(z.literal('')),
  developer_name: z.string().trim().max(120).optional().or(z.literal(''))
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const body = Schema.parse(await request.json())
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('store_users')
    .update({
      enterprise_certification_status: body.enterprise_certification_status,
      team_plan_status: body.team_plan_status,
      organization_name: body.organization_name || null,
      developer_name: body.developer_name || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json({ ok: true })
}
