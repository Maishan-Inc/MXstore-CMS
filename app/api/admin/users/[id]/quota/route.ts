import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const Schema = z.object({
  download_quota_bytes: z.number().int().min(0),
  distribution_quota_bytes: z.number().int().min(0),
  distribution_charge_threshold_bytes: z.number().int().min(0)
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const body = Schema.parse(await request.json())
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('store_users')
    .update({
      download_quota_bytes: body.download_quota_bytes,
      distribution_quota_bytes: body.distribution_quota_bytes,
      distribution_charge_threshold_bytes: body.distribution_charge_threshold_bytes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json({ ok: true })
}
