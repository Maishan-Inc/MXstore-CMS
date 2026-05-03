import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const GrantSchema = z.object({
  user_id: z.string().uuid(),
  app_id: z.string().uuid()
})

const RevokeSchema = z.object({
  user_id: z.string().uuid(),
  app_id: z.string().uuid()
})

export async function POST(request: NextRequest) {
  await requireAdmin()
  const body = GrantSchema.parse(await request.json())
  const supabase = createAdminClient()

  const { error } = await supabase.from('app_entitlements').upsert({
    user_id: body.user_id,
    app_id: body.app_id,
    source: 'manual'
  }, { onConflict: 'user_id,app_id' })

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  await requireAdmin()
  const body = RevokeSchema.parse(await request.json())
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('app_entitlements')
    .delete()
    .eq('user_id', body.user_id)
    .eq('app_id', body.app_id)

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json({ ok: true })
}
