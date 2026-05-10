import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const Schema = z.object({
  status: z.enum(['approved', 'rejected']),
  review_note: z.string().trim().max(1000).optional()
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  const { id } = await params
  const parsed = Schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: '审核参数无效' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('user_kyc_documents')
    .update({
      status: parsed.data.status,
      review_note: parsed.data.review_note ?? null,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
