import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/install',
  '/api/install',
  '/login',
  '/auth',
  '/api/auth'
]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always allow public paths
  if (isPublicPath(pathname)) {
    const response = NextResponse.next({ request })
    response.headers.set('x-pathname', pathname)
    return response
  }

  // Redirect to install if Supabase env vars are missing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.redirect(new URL('/install', request.url))
  }

  try {
    let response = NextResponse.next({ request })
    response.headers.set('x-pathname', pathname)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          }
        }
      }
    )

    await supabase.auth.getUser()
    return response
  } catch {
    // Supabase client failed (bad URL, invalid key, network error) - redirect to install
    return NextResponse.redirect(new URL('/install', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
}
