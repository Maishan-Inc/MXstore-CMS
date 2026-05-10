import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { defaultIdentityPlanSettings, normalizeIdentityPlanSettings, type IdentityPlanSettings } from '@/lib/identity-plans'

export const IDENTITY_PLAN_SETTINGS_KEY = 'identity_plan_config'

export async function getIdentityPlanSettings(): Promise<IdentityPlanSettings> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return defaultIdentityPlanSettings
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', IDENTITY_PLAN_SETTINGS_KEY)
      .maybeSingle()

    if (error || !data?.value) return defaultIdentityPlanSettings
    return normalizeIdentityPlanSettings(JSON.parse(data.value))
  } catch {
    return defaultIdentityPlanSettings
  }
}
