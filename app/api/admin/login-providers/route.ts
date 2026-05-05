import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const LoginProviderSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/),
  provider_type: z.enum(['wallet', 'oauth', 'password']),
  label: z.string().min(1),
  button_text: z.string().min(1),
  provider: z.string().optional().nullable(),
  connector_name: z.string().optional().nullable(),
  icon_url: z.string().optional().nullable(),
  sort_order: z.number().int().default(0),
  enabled: z.boolean().default(true)
})

export async function GET() {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('login_providers')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  await requireAdmin()
  const body = LoginProviderSchema.parse(await request.json())
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('login_providers')
    .upsert({
      id: body.id,
      provider_type: body.provider_type,
      label: body.label,
      button_text: body.button_text,
      provider: body.provider || null,
      connector_name: body.connector_name || null,
      icon_url: body.icon_url || null,
      sort_order: body.sort_order,
      enabled: body.enabled,
      updated_at: new Date().toISOString()
    })
    .select('id')
    .single()

  if (error) return new NextResponse(error.message, { status: 400 })
  return NextResponse.json(data)
}

