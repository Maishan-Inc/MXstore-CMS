import { NextResponse } from 'next/server'
import { z } from 'zod'
import { hasStoreUserWithEmail, sendPasswordRegistrationCode } from '@/lib/password-registration'

const Schema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128)
})

export async function POST(request: Request) {
  const parsed = Schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: 'BAD_REQUEST', error: '请输入有效邮箱和至少 8 位密码' },
      { status: 400 }
    )
  }

  try {
    const userExists = await hasStoreUserWithEmail(parsed.data.email)
    if (userExists) {
      return NextResponse.json(
        { ok: false, code: 'USER_EXISTS', error: '该邮箱已注册，请直接输入密码登录' },
        { status: 409 }
      )
    }

    const result = await sendPasswordRegistrationCode(parsed.data.email)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: 'REGISTRATION_CODE_SEND_FAILED',
        error: '注册验证码发送失败',
        detail: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
