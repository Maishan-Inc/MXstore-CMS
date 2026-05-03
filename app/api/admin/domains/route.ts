import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { encryptSecret } from '@/lib/crypto'
import { normalizeDomain, normalizeOpenListBaseUrl } from '@/lib/admin/domains'

const Schema = z.object({
  domain: z.string().min(3),
  openlist_base_url: z.string().url(),
  admin_token: z.string().optional().nullable(),
  sign_ttl_seconds: z.number().int().min(30).max(86400).default(300),
  enabled: z.boolean().default(true)
})

export async function GET() {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('token_domains')
    .select('id,domain,openlist_base_url,sign_ttl_seconds,enabled,created_at')
    .order('created_at', { ascending: false })

  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  await requireAdmin()
  const body = Schema.parse(await request.json())
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('token_domains')
    .insert({
      domain: normalizeDomain(body.domain),
      openlist_base_url: normalizeOpenListBaseUrl(body.openlist_base_url),
      encrypted_admin_token: encryptSecret(body.admin_token || ''),
      sign_ttl_seconds: body.sign_ttl_seconds,
      enabled: body.enabled
    })
    .select('id,domain')
    .single()

  if (error) return new NextResponse(error.message, { status: 400 })
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  await requireAdmin()
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return new NextResponse('缺少域名记录 id', { status: 400 })

  const body = Schema.parse(await request.json())
  const updatePayload: Record<string, unknown> = {
    domain: normalizeDomain(body.domain),
    openlist_base_url: normalizeOpenListBaseUrl(body.openlist_base_url),
    sign_ttl_seconds: body.sign_ttl_seconds,
    enabled: body.enabled,
    updated_at: new Date().toISOString()
  }

  if (body.admin_token) {
    updatePayload.encrypted_admin_token = encryptSecret(body.admin_token)
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('token_domains')
    .update(updatePayload)
    .eq('id', id)
    .select('id,domain')
    .single()

  if (error) return new NextResponse(error.message, { status: 400 })
  return NextResponse.json(data)
}
