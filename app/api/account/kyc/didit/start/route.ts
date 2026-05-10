import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDiditApiKey, getDiditWebhookSecret, getKycSettings } from '@/lib/kyc-settings'

function appOriginFromHeaders(headerList: Headers) {
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000'
  return `${proto}://${host}`
}

function readDiditResponse(value: unknown) {
  const record = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
  return {
    sessionId: String(record.session_id ?? record.id ?? record.sessionId ?? ''),
    verificationUrl: String(record.url ?? record.verification_url ?? record.verificationUrl ?? record.redirect_url ?? '')
  }
}

export async function POST() {
  const user = await requireUser()
  const settings = await getKycSettings()
  if (!settings.didit.enabled) {
    return NextResponse.json({ ok: false, error: 'Didit KYC 未启用' }, { status: 400 })
  }

  const apiKey = getDiditApiKey(settings)
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'Didit API Key 未配置' }, { status: 400 })
  }
  const webhookSecret = getDiditWebhookSecret(settings)
  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: 'Didit Webhook Secret 未配置' }, { status: 400 })
  }

  const headerList = await headers()
  const origin = appOriginFromHeaders(headerList)
  const callbackUrl = `${origin}/api/kyc/didit/webhook?token=${encodeURIComponent(webhookSecret)}`
  const redirectUrl = `${origin}/dashboard/verification`

  const payload = {
    workflow_id: settings.didit.workflowId || undefined,
    vendor_data: user.id,
    callback: callbackUrl,
    callback_method: 'both',
    metadata: JSON.stringify({ redirectUrl }),
    contact_details: {
      email: user.email ?? undefined,
      send_notification_emails: false,
      email_lang: 'zh-CN'
    }
  }

  try {
    const response = await fetch(`${settings.didit.baseUrl.replace(/\/$/, '')}/v3/session/`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    const text = await response.text()
    const body = text ? JSON.parse(text) as unknown : {}
    if (!response.ok) {
      return NextResponse.json({ ok: false, error: 'Didit KYC 会话创建失败', detail: body }, { status: response.status })
    }

    const didit = readDiditResponse(body)
    const supabase = createAdminClient()
    const { error } = await supabase.from('user_kyc_sessions').insert({
      user_id: user.id,
      provider: 'didit',
      provider_session_id: didit.sessionId || null,
      provider_status: 'created',
      verification_url: didit.verificationUrl || null,
      raw_response: body
    })
    if (error) throw error

    return NextResponse.json({ ok: true, sessionId: didit.sessionId, verificationUrl: didit.verificationUrl })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Didit KYC 请求失败', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
