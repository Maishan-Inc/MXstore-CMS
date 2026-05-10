import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createRouteClient } from '@/lib/supabase/route'
import { createAdminClient } from '@/lib/supabase/admin'
import { upsertStoreUserProfile } from '@/lib/auth'
import { getNextRouteForUser } from '@/lib/account'
import { consumePasswordRegistrationCode, hasStoreUserWithEmail, verifyPasswordRegistrationCode } from '@/lib/password-registration'

const passwordLoginSchema = z.object({
  email: z.string().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128),
  registration_code: z.string().trim().regex(/^\d{6}$/).optional()
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
  const credentials = {
    email: parsed.data.email,
    password: parsed.data.password
  }
  let { data, error } = await supabase.auth.signInWithPassword(credentials)

  if (error || !data.user) {
    const errorMessage = error?.message ?? ''
    if (!shouldAutoRegister(errorMessage)) {
      return NextResponse.json({ ok: false, error: '邮箱或密码不正确' }, { status: 401 })
    }

    const admin = createAdminClient()
    const userExists = await hasStoreUserWithEmail(parsed.data.email)
    if (userExists) {
      return NextResponse.json({ ok: false, error: '邮箱或密码不正确' }, { status: 401 })
    }

    if (!parsed.data.registration_code) {
      return NextResponse.json(
        {
          ok: false,
          code: 'REGISTRATION_CODE_REQUIRED',
          error: '该邮箱尚未注册，请获取验证码完成注册'
        },
        { status: 409 }
      )
    }

    let registrationCodeId: string
    try {
      registrationCodeId = await verifyPasswordRegistrationCode(parsed.data.email, parsed.data.registration_code)
    } catch (verifyError) {
      return NextResponse.json(
        {
          ok: false,
          code: 'REGISTRATION_CODE_INVALID',
          error: verifyError instanceof Error ? verifyError.message : '注册验证码无效'
        },
        { status: 400 }
      )
    }

    const { error: createError } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true
    })

    if (createError) {
      return NextResponse.json({ ok: false, error: createError.message }, { status: 409 })
    }
    await consumePasswordRegistrationCode(registrationCodeId)

    const retry = await supabase.auth.signInWithPassword(credentials)
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
