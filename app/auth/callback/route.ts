import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { appUrl } from '@/lib/env'
import { getNextRouteForUser } from '@/lib/account'
import { loadStoreUserBy, upsertStoreUserProfile } from '@/lib/auth'

function socialAvatarUrl(metadata: Record<string, unknown>) {
  const avatar = metadata.avatar_url ?? metadata.picture
  return typeof avatar === 'string' && avatar.length > 0 ? avatar : null
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  let next = request.nextUrl.searchParams.get('next')
  if (code) {
    const supabase = await createClient()
    const { data } = await supabase.auth.exchangeCodeForSession(code)
    if (data.user) {
      const adminClient = createAdminClient()
      await upsertStoreUserProfile(adminClient, {
        auth_user_id: data.user.id,
        email: data.user.email ?? null,
        display_name: data.user.user_metadata?.name ?? data.user.email ?? null
      }, {
        onConflict: 'auth_user_id',
        lookupColumn: 'auth_user_id',
        lookupValue: data.user.id
      })

      const avatarUrl = socialAvatarUrl(data.user.user_metadata ?? {})
      if (avatarUrl) {
        const { data: existingUser } = await adminClient
          .from('store_users')
          .select('id,avatar_source')
          .eq('auth_user_id', data.user.id)
          .maybeSingle()

        if (existingUser?.avatar_source !== 'custom') {
          await adminClient
            .from('store_users')
            .update({
              avatar_url: avatarUrl,
              avatar_source: 'oauth',
              updated_at: new Date().toISOString()
            })
            .eq('auth_user_id', data.user.id)
        }
      }

      if (!next) {
        const storeUser = await loadStoreUserBy(adminClient, 'auth_user_id', data.user.id)
        next = storeUser ? getNextRouteForUser(storeUser) : '/dashboard'
      }
    }
  }
  return NextResponse.redirect(`${appUrl(request.nextUrl.origin)}${next ?? '/dashboard'}`)
}
