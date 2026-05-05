import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { appUrl } from '@/lib/env'

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider') ?? ''
  const admin = createAdminClient()
  const { data: configuredProvider } = await admin
    .from('login_providers')
    .select('id')
    .eq('provider_type', 'oauth')
    .eq('provider', provider)
    .eq('enabled', true)
    .maybeSingle()

  if (!configuredProvider && provider !== 'github' && provider !== 'google') {
    return new NextResponse('Unsupported provider', { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as 'github' | 'google',
    options: { redirectTo: `${appUrl()}/auth/callback` }
  })

  if (error || !data.url) return new NextResponse(error?.message ?? 'OAuth failed', { status: 500 })
  return NextResponse.redirect(data.url)
}
