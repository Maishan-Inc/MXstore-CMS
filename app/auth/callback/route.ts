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

function redirectToLoginError(origin: string, message: string) {
  const url = new URL('/login', appUrl(origin))
  url.searchParams.set('auth_error', message)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const oauthError = request.nextUrl.searchParams.get('error')
  const oauthErrorDescription = request.nextUrl.searchParams.get('error_description')
  if (oauthError || oauthErrorDescription) {
    return redirectToLoginError(
      request.nextUrl.origin,
      oauthErrorDescription ?? oauthError ?? '第三方授权失败'
    )
  }

  const code = request.nextUrl.searchParams.get('code')
  let next = request.nextUrl.searchParams.get('next')
  if (code) {
    let sessionResult: Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>['auth']['exchangeCodeForSession']>>
    try {
      const supabase = await createClient()
      sessionResult = await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      return redirectToLoginError(request.nextUrl.origin, `第三方授权回调初始化失败：${detail}`)
    }

    const { data, error } = sessionResult
    if (error) {
      return redirectToLoginError(request.nextUrl.origin, `第三方授权回调失败：${error.message}`)
    }

    if (data.user) {
      let adminClient: ReturnType<typeof createAdminClient>
      try {
        adminClient = createAdminClient()
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        return redirectToLoginError(request.nextUrl.origin, `第三方账户资料同步初始化失败：${detail}`)
      }

      try {
        await upsertStoreUserProfile(adminClient, {
          auth_user_id: data.user.id,
          email: data.user.email ?? null,
          display_name: data.user.user_metadata?.name ?? data.user.email ?? null
        }, {
          onConflict: 'auth_user_id',
          lookupColumn: 'auth_user_id',
          lookupValue: data.user.id
        })
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error)
        return redirectToLoginError(request.nextUrl.origin, `第三方账户资料同步失败：${detail}`)
      }

      const avatarUrl = socialAvatarUrl(data.user.user_metadata ?? {})
      if (avatarUrl) {
        const { data: existingUser } = await adminClient
          .from('store_users')
          .select('id,avatar_source')
          .eq('auth_user_id', data.user.id)
          .maybeSingle()

        if (existingUser?.avatar_source !== 'custom') {
          const { error: avatarError } = await adminClient
            .from('store_users')
            .update({
              avatar_url: avatarUrl,
              avatar_source: 'oauth',
              updated_at: new Date().toISOString()
            })
            .eq('auth_user_id', data.user.id)
          if (avatarError) {
            return redirectToLoginError(request.nextUrl.origin, `第三方头像同步失败：${avatarError.message}`)
          }
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
