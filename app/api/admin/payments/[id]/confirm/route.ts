import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const supabase = createAdminClient()

  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('id,status,package_id,app_id,user_id')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) return new NextResponse(fetchError.message, { status: 500 })
  if (!payment) return new NextResponse('订单不存在', { status: 404 })
  if (payment.status === 'confirmed') return new NextResponse('订单已确认', { status: 400 })

  const { error: updateError } = await supabase
    .from('payments')
    .update({ status: 'confirmed', reject_reason: null })
    .eq('id', id)

  if (updateError) return new NextResponse(updateError.message, { status: 500 })

  if (payment.package_id) {
    const { data: pkg } = await supabase
      .from('traffic_packages')
      .select('bytes_amount')
      .eq('id', payment.package_id)
      .maybeSingle()

    if (pkg) {
      await supabase.from('user_traffic_ledger').insert({
        user_id: payment.user_id,
        delta_bytes: pkg.bytes_amount,
        reason: 'purchase_traffic',
        payment_id: payment.id
      })
    }
  }

  if (payment.app_id) {
    await supabase.from('app_entitlements').insert({
      user_id: payment.user_id,
      app_id: payment.app_id,
      source: 'payment'
    }).select()
  }

  return NextResponse.json({ ok: true })
}
