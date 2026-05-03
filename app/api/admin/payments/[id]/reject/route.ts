import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const Schema = z.object({
  reason: z.string().min(1).max(500)
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const body = Schema.parse(await request.json())
  const supabase = createAdminClient()

  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('id,status')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) return new NextResponse(fetchError.message, { status: 500 })
  if (!payment) return new NextResponse('订单不存在', { status: 404 })
  if (payment.status === 'rejected') return new NextResponse('订单已拒绝', { status: 400 })

  const { error: updateError } = await supabase
    .from('payments')
    .update({ status: 'rejected', reject_reason: body.reason })
    .eq('id', id)

  if (updateError) return new NextResponse(updateError.message, { status: 500 })

  return NextResponse.json({ ok: true })
}
