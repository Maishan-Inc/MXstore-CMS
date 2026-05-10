import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getIdentityPlanSettings, IDENTITY_PLAN_SETTINGS_KEY } from '@/lib/identity-plan-settings'

const PlanSchema = z.object({
  type: z.enum(['personal', 'independent_developer', 'enterprise', 'team_studio']),
  title: z.string().trim().min(1).max(60),
  subtitle: z.string().trim().min(1).max(120),
  badge: z.string().trim().max(40),
  description: z.string().trim().min(1).max(500),
  note: z.string().trim().min(1).max(500),
  priceLabel: z.string().trim().min(1).max(40),
  periodLabel: z.string().trim().min(1).max(60),
  ctaLabel: z.string().trim().min(1).max(40),
  features: z.array(z.string().trim().min(1).max(120)).min(1).max(12),
  highlighted: z.boolean(),
  enabled: z.boolean(),
  freeTierEnabled: z.boolean(),
  sortOrder: z.number().int().min(0).max(100)
})

const IdentityPlanSettingsSchema = z.object({
  pageTitle: z.string().trim().min(1).max(80),
  pageSubtitle: z.string().trim().min(1).max(240),
  plans: z.object({
    personal: PlanSchema,
    independent_developer: PlanSchema,
    enterprise: PlanSchema,
    team_studio: PlanSchema
  })
})

export async function GET() {
  await requireAdmin()
  return NextResponse.json(await getIdentityPlanSettings())
}

export async function PUT(request: Request) {
  await requireAdmin()
  const body = IdentityPlanSettingsSchema.parse(await request.json())
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('system_settings')
    .upsert({
      key: IDENTITY_PLAN_SETTINGS_KEY,
      value: JSON.stringify(body),
      group_name: 'account',
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' })

  if (error) return new NextResponse(error.message, { status: 400 })
  return NextResponse.json({ ok: true })
}
