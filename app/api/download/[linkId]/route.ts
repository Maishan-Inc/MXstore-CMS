import { NextRequest, NextResponse } from 'next/server'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { makeSignedDownloadUrl } from '@/lib/openlist'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ linkId: string }> }) {
  const { linkId } = await params
  const supabase = createAdminClient()

  const { data: link, error } = await supabase
    .from('app_links')
    .select('id,name,input_url,file_size_bytes,charge_traffic,apps(id,name,is_paid,download_permission,published,created_by)')
    .eq('id', linkId)
    .maybeSingle()

  const appRecord = Array.isArray(link?.apps) ? link.apps[0] : link?.apps

  if (error) return new NextResponse(error.message, { status: 500 })
  if (!link || !appRecord?.published) return new NextResponse('Not found', { status: 404 })

  const permission = appRecord.download_permission ?? (appRecord.is_paid ? 'purchase' : 'login')
  const user = await getCurrentStoreUser()
  const fileSize = Number(link.file_size_bytes ?? 0)
  const shouldChargeDistribution = Boolean(appRecord.created_by && link.charge_traffic && fileSize > 0)
  let distributionBytesToCharge = 0

  if (shouldChargeDistribution) {
    const { data: publisher } = await supabase
      .from('store_users')
      .select('id,distribution_charge_threshold_bytes')
      .eq('id', appRecord.created_by)
      .maybeSingle()
    const threshold = Number(publisher?.distribution_charge_threshold_bytes ?? 1073741824)
    distributionBytesToCharge = fileSize > threshold ? fileSize : 0
  }

  if (permission !== 'public' && !user) {
    return NextResponse.redirect(new URL('/login', _request.url), 302)
  }

  if (permission === 'purchase') {
    const { data: entitlement } = await supabase
      .from('app_entitlements')
      .select('id')
      .eq('user_id', user?.id)
      .eq('app_id', appRecord.id)
      .maybeSingle()
    if (!entitlement) return new NextResponse('该应用需要购买或管理员授权后才能下载', { status: 402 })
  }

  const bytesToCharge = user && link.charge_traffic ? Number(link.file_size_bytes ?? 0) : 0
  if (bytesToCharge > 0 && user) {
    const { data: balance } = await supabase
      .from('user_traffic_balances')
      .select('balance_bytes')
      .eq('user_id', user.id)
      .maybeSingle()
    if (Number(balance?.balance_bytes ?? 0) < bytesToCharge) {
      return new NextResponse('剩余流量不足，请先充值套餐', { status: 402 })
    }
  }

  if (distributionBytesToCharge > 0 && appRecord.created_by) {
    const { data: balance } = await supabase
      .from('user_distribution_traffic_balances')
      .select('balance_bytes')
      .eq('user_id', appRecord.created_by)
      .maybeSingle()
    if (Number(balance?.balance_bytes ?? 0) < distributionBytesToCharge) {
      return new NextResponse('应用分发流量不足，请先补充分发额度', { status: 402 })
    }
  }

  const signed = await makeSignedDownloadUrl(link.input_url)
  const { data: session, error: sessionError } = user
    ? await supabase
        .from('download_sessions')
        .insert({
          user_id: user.id,
          app_id: appRecord.id,
          app_link_id: link.id,
          status: 'issued',
          bytes_charged: bytesToCharge,
          distribution_bytes_charged: distributionBytesToCharge,
          link_kind: signed.kind,
          openlist_path: signed.openlistPath,
          expires_at: signed.expiresAt?.toISOString() ?? null
        })
        .select('id')
        .single()
    : { data: null, error: null }

  if (sessionError) return new NextResponse(sessionError.message, { status: 500 })

  if (user || distributionBytesToCharge > 0) {
    const { data: deducted, error: deductError } = await supabase
      .rpc('deduct_download_and_distribution_traffic', {
        p_user_id: user?.id ?? appRecord.created_by,
        p_download_bytes: bytesToCharge,
        p_distribution_user_id: distributionBytesToCharge > 0 ? appRecord.created_by : null,
        p_distribution_bytes: distributionBytesToCharge,
        p_download_session_id: session?.id ?? null
      })
      .single()

    if (deductError) return new NextResponse(deductError.message, { status: 500 })
    if (!deducted) {
      return new NextResponse(
        distributionBytesToCharge > 0 && appRecord.created_by
          ? '应用分发流量不足，请先补充分发额度'
          : '剩余流量不足，请先充值套餐',
        { status: 402 }
      )
    }
  }

  return NextResponse.redirect(signed.url, 302)
}
