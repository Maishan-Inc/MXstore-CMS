import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const Schema = z.object({
  role: z.enum(['user', 'admin'])
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const body = Schema.parse(await request.json())
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('store_users')
    .update({ role: body.role, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return new NextResponse(error.message, { status: 500 })

  return NextResponse.json({ ok: true })
}
