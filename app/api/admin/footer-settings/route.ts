import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { defaultFooterSettings, getFooterSettings } from '@/lib/footer-settings'

const LinkSchema = z.object({
  label: z.string().min(1).max(40),
  href: z.string().min(1).max(300),
  enabled: z.boolean()
})

const LinkGroupSchema = z.object({
  title: z.string().min(1).max(40),
  links: z.array(LinkSchema).min(1).max(8)
})

const SocialSchema = z.object({
  id: z.enum(['facebook', 'x', 'instagram', 'youtube', 'linkedin', 'github', 'telegram', 'discord']),
  label: z.string().min(1).max(40),
  href: z.string().max(300),
  enabled: z.boolean()
})

const FooterSettingsSchema = z.object({
  enabled: z.boolean(),
  brandName: z.string().min(1).max(40),
  copyright: z.string().min(1).max(160),
  description: z.string().max(1200),
  links: z.array(LinkSchema).min(1).max(12),
  linkGroups: z.array(LinkGroupSchema).min(1).max(6),
  socials: z.array(SocialSchema).max(defaultFooterSettings.socials.length)
})

export async function GET() {
  await requireAdmin()
  return NextResponse.json(await getFooterSettings())
}

export async function PUT(request: Request) {
  await requireAdmin()
  const body = FooterSettingsSchema.parse(await request.json())
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('system_settings')
    .upsert({
      key: 'footer_config',
      value: JSON.stringify(body),
      group_name: 'site',
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' })

  if (error) return new NextResponse(error.message, { status: 400 })
  return NextResponse.json({ ok: true })
}
