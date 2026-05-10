import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDiditWebhookSecret, getKycSettings } from '@/lib/kyc-settings'

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value) return value
  }
  return ''
}

function mapStatus(status: string) {
  const normalized = status.toLowerCase()
  if (['approved', 'verified', 'completed', 'success', 'accepted'].includes(normalized)) return 'verified'
  if (['rejected', 'declined', 'failed'].includes(normalized)) return 'rejected'
  if (['needs_more_info', 'resubmission_requested'].includes(normalized)) return 'needs_more_info'
  return 'pending'
}

export async function POST(request: Request) {
  const settings = await getKycSettings()
  const expectedToken = getDiditWebhookSecret(settings)
  const requestUrl = new URL(request.url)
  const token = requestUrl.searchParams.get('token') ?? ''
  if (!expectedToken || token !== expectedToken) {
    return NextResponse.json({ ok: false, error: 'Invalid webhook token' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: 'Invalid webhook payload' }, { status: 400 })
  }

  const record = body as Record<string, unknown>
  const userId = readString(record, ['vendor_data', 'vendorData', 'user_id', 'userId'])
  const sessionId = readString(record, ['session_id', 'sessionId', 'id'])
  const providerStatus = readString(record, ['status', 'decision', 'state'])
  if (!userId && !sessionId) {
    return NextResponse.json({ ok: false, error: 'Missing Didit session or user id' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const kycStatus = mapStatus(providerStatus)

  const sessionPatch = {
    provider_status: providerStatus || kycStatus,
    raw_response: record,
    updated_at: new Date().toISOString()
  }

  if (sessionId) {
    await supabase
      .from('user_kyc_sessions')
      .update(sessionPatch)
      .eq('provider', 'didit')
      .eq('provider_session_id', sessionId)
  }

  if (userId) {
    await supabase
      .from('store_users')
      .update({
        kyc_status: kycStatus,
        identity_plan_status: kycStatus === 'verified' ? 'active' : 'pending_kyc',
        enterprise_certification_status: kycStatus === 'verified' ? 'verified' : kycStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
  }

  return NextResponse.json({ ok: true })
}
