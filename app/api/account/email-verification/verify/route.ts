import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { verifyEmailCode } from '@/lib/email-verification'

const Schema = z.object({
  purpose: z.enum(['account_email', 'identity_public_email', 'identity_private_email']),
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  code: z.string().trim().regex(/^\d{6}$/, '验证码必须是 6 位数字')
})

export async function POST(request: Request) {
  const user = await requireUser()
  const parsed = Schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: '验证码参数无效' }, { status: 400 })
  }

  try {
    await verifyEmailCode(user.id, parsed.data.purpose, parsed.data.email, parsed.data.code)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: '邮箱验证失败', detail: error instanceof Error ? error.message : String(error) },
      { status: 400 }
    )
  }
}
