import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { getKycSettings, saveKycSettings, toPublicKycSettings } from '@/lib/kyc-settings'

const Schema = z.object({
  didit: z.object({
    enabled: z.boolean(),
    apiKey: z.string().max(1000).optional(),
    keepApiKey: z.boolean().optional(),
    webhookSecret: z.string().max(1000).optional(),
    keepWebhookSecret: z.boolean().optional(),
    baseUrl: z.string().trim().url(),
    workflowId: z.string().trim().max(200)
  }),
  s3: z.object({
    enabled: z.boolean(),
    endpoint: z.string().trim().url().or(z.literal('')),
    region: z.string().trim().min(1).max(80),
    bucket: z.string().trim().max(200),
    prefix: z.string().trim().min(1).max(200),
    accessKeyId: z.string().trim().max(255),
    secretAccessKey: z.string().max(1000).optional(),
    keepSecretAccessKey: z.boolean().optional(),
    publicBaseUrl: z.string().trim().url().or(z.literal('')),
    pathStyle: z.boolean()
  })
})

export async function GET() {
  await requireAdmin()
  return NextResponse.json(toPublicKycSettings(await getKycSettings()))
}

export async function POST(request: Request) {
  await requireAdmin()
  const parsed = Schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'KYC 配置无效', detail: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const settings = await saveKycSettings(parsed.data)
    return NextResponse.json({ ok: true, settings: toPublicKycSettings(settings) })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'KYC 配置保存失败', detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
