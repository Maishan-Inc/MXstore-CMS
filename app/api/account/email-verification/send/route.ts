import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { sendEmailVerificationCode } from '@/lib/email-verification'

const Schema = z.object({
  purpose: z.enum(['account_email', 'identity_public_email', 'identity_private_email']),
  email: z.string().trim().email().transform((email) => email.toLowerCase())
})

export async function POST(request: Request) {
  const user = await requireUser()
  const parsed = Schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: '邮箱地址或验证类型无效' }, { status: 400 })
  }

  try {
    const result = await sendEmailVerificationCode(user, parsed.data.purpose, parsed.data.email)
    return NextResponse.json({ ok: true, expiresAt: result.expiresAt })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: '验证码发送失败', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
