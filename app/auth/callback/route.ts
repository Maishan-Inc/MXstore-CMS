import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { appUrl } from '@/lib/env'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  let next = request.nextUrl.searchParams.get('next')
  if (code) {
    const supabase = await createClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)
    if (data.user && !next) {
      // Check if user is admin and redirect accordingly
      const adminClient = createAdminClient()
      const { data: storeUser } = await adminClient
        .from('store_users')
        .select('role')
        .eq('auth_user_id', data.user.id)
        .maybeSingle()
      next = storeUser?.role === 'admin' ? '/admin' : '/dashboard'
    }
  }
  return NextResponse.redirect(`${appUrl()}${next ?? '/dashboard'}`)
}
