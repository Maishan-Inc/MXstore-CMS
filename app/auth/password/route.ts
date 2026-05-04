import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const passwordLoginSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128)
})

export async function POST(request: NextRequest) {
  const parsed = passwordLoginSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: '请输入有效的邮箱和至少 8 位密码' },
      { status: 400 }
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: '邮箱或密码不正确' }, { status: 401 })
  }

  const { data: storeUser } = await supabase
    .from('store_users')
    .select('role')
    .eq('auth_user_id', data.user.id)
    .maybeSingle()

  return NextResponse.json({
    ok: true,
    next: storeUser?.role === 'admin' ? '/admin' : '/dashboard'
  })
}
