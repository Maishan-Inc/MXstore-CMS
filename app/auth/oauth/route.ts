import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { appUrl } from '@/lib/env'

const allowedProviders = new Set(['github', 'google'])

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider') ?? ''
  if (!allowedProviders.has(provider)) return new NextResponse('Unsupported provider', { status: 400 })

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as 'github' | 'google',
    options: { redirectTo: `${appUrl()}/auth/callback` }
  })

  if (error || !data.url) return new NextResponse(error?.message ?? 'OAuth failed', { status: 500 })
  return NextResponse.redirect(data.url)
}
