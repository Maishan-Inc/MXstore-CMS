import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { getEmailSettings, saveEmailSettings, toPublicEmailSettings } from '@/lib/email-settings'

const TemplateSchema = z.object({
  subject: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(4000)
})

const Schema = z.object({
  enabled: z.boolean(),
  host: z.string().trim().max(255),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  startTls: z.boolean(),
  username: z.string().trim().max(255),
  password: z.string().max(512).optional(),
  keepPassword: z.boolean().optional(),
  fromEmail: z.string().trim().email().or(z.literal('')),
  fromName: z.string().trim().min(1).max(120),
  templates: z.object({
    verification_code: TemplateSchema,
    identity_approved: TemplateSchema,
    identity_rejected: TemplateSchema,
    identity_needs_more_info: TemplateSchema
  })
})

export async function GET() {
  await requireAdmin()
  return NextResponse.json(toPublicEmailSettings(await getEmailSettings()))
}

export async function POST(request: Request) {
  await requireAdmin()
  const parsed = Schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: '邮箱配置无效', detail: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const settings = await saveEmailSettings(parsed.data)
    return NextResponse.json({ ok: true, settings: toPublicEmailSettings(settings) })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: '邮箱配置保存失败', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
