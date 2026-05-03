import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { makeSignedDownloadUrl } from '@/lib/openlist'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ linkId: string }> }) {
  const user = await requireUser()
  const { linkId } = await params
  const supabase = createAdminClient()

  const { data: link, error } = await supabase
    .from('app_links')
    .select('id,name,input_url,file_size_bytes,charge_traffic,apps(id,name,is_paid,published)')
    .eq('id', linkId)
    .maybeSingle()

  const appRecord = Array.isArray(link?.apps) ? link.apps[0] : link?.apps

  if (error) return new NextResponse(error.message, { status: 500 })
  if (!link || !appRecord?.published) return new NextResponse('Not found', { status: 404 })

  if (appRecord.is_paid) {
    const { data: entitlement } = await supabase
      .from('app_entitlements')
      .select('id')
      .eq('user_id', user.id)
      .eq('app_id', appRecord.id)
      .maybeSingle()
    if (!entitlement) return new NextResponse('该应用需要购买或管理员授权后才能下载', { status: 402 })
  }

  const bytesToCharge = link.charge_traffic ? Number(link.file_size_bytes ?? 0) : 0
  if (bytesToCharge > 0) {
    const { data: balance } = await supabase
      .from('user_traffic_balances')
      .select('balance_bytes')
      .eq('user_id', user.id)
      .maybeSingle()
    if (Number(balance?.balance_bytes ?? 0) < bytesToCharge) {
      return new NextResponse('剩余流量不足，请先充值套餐', { status: 402 })
    }
  }

  const signed = await makeSignedDownloadUrl(link.input_url)
  const { data: session, error: sessionError } = await supabase
    .from('download_sessions')
    .insert({
      user_id: user.id,
      app_id: appRecord.id,
      app_link_id: link.id,
      status: 'issued',
      bytes_charged: bytesToCharge,
      link_kind: signed.kind,
      openlist_path: signed.openlistPath,
      expires_at: signed.expiresAt?.toISOString() ?? null
    })
    .select('id')
    .single()

  if (sessionError) return new NextResponse(sessionError.message, { status: 500 })

  if (bytesToCharge > 0) {
    const { data: deducted, error: deductError } = await supabase
      .rpc('deduct_traffic', {
        p_user_id: user.id,
        p_bytes: bytesToCharge,
        p_reason: 'download',
        p_download_session_id: session.id
      })
      .single()

    if (deductError) return new NextResponse(deductError.message, { status: 500 })
    if (!deducted) return new NextResponse('剩余流量不足，请先充值套餐', { status: 402 })
  }

  return NextResponse.redirect(signed.url, 302)
}
