import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createRouteClient } from '@/lib/supabase/route'
import { createAdminClient } from '@/lib/supabase/admin'
import { upsertStoreUserProfile } from '@/lib/auth'
import { getNextRouteForUser } from '@/lib/account'

const passwordLoginSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128)
})

function shouldAutoRegister(errorMessage: string) {
  const message = errorMessage.toLowerCase()
  return message.includes('invalid login credentials') ||
    message.includes('invalid credentials') ||
    message.includes('user not found')
}

export async function POST(request: NextRequest) {
  const parsed = passwordLoginSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: '请输入有效的邮箱和至少 8 位密码' },
      { status: 400 }
    )
  }

  const { supabase, applyAuthCookies } = createRouteClient(request)
  let { data, error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error || !data.user) {
    const errorMessage = error?.message ?? ''
    if (!shouldAutoRegister(errorMessage)) {
      return NextResponse.json({ ok: false, error: '邮箱或密码不正确' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { error: createError } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true
    })

    if (createError) {
      return NextResponse.json({ ok: false, error: '邮箱或密码不正确' }, { status: 401 })
    }

    const retry = await supabase.auth.signInWithPassword(parsed.data)
    data = retry.data
    error = retry.error
  }

  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: '邮箱或密码不正确' }, { status: 401 })
  }

  const admin = createAdminClient()
  let storeUser: Awaited<ReturnType<typeof upsertStoreUserProfile>>
  try {
    storeUser = await upsertStoreUserProfile(
      admin,
      {
        auth_user_id: data.user.id,
        email: data.user.email ?? parsed.data.email,
        display_name: data.user.user_metadata?.name ?? data.user.email ?? parsed.data.email
      },
      {
        onConflict: 'auth_user_id',
        lookupColumn: 'auth_user_id',
        lookupValue: data.user.id
      }
    )
  } catch {
    return NextResponse.json({ ok: false, error: '账户资料同步失败，请重试' }, { status: 500 })
  }

  return applyAuthCookies(NextResponse.json({
    ok: true,
    next: storeUser ? getNextRouteForUser(storeUser) : '/dashboard'
  }))
}
