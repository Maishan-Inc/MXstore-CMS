import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { appUrl } from '@/lib/env'

function redirectToLoginError(origin: string, message: string) {
  const url = new URL('/login', appUrl(origin))
  url.searchParams.set('auth_error', message)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const provider = request.nextUrl.searchParams.get('provider') ?? ''
  if (provider !== 'github' && provider !== 'google') {
    return redirectToLoginError(request.nextUrl.origin, '不支持的第三方登录方式')
  }

  let oauthResult: Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>['auth']['signInWithOAuth']>>
  try {
    const supabase = await createClient()
    oauthResult = await supabase.auth.signInWithOAuth({
      provider: provider as 'github' | 'google',
      options: { redirectTo: `${appUrl(request.nextUrl.origin)}/auth/callback` }
    })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return redirectToLoginError(request.nextUrl.origin, `第三方登录初始化失败：${detail}`)
  }

  const { data, error } = oauthResult
  if (error || !data.url) {
    return redirectToLoginError(request.nextUrl.origin, error?.message ?? `${provider} 授权地址生成失败`)
  }
  return NextResponse.redirect(data.url)
}
