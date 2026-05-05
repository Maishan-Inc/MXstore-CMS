import 'server-only'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { NextRequest, NextResponse } from 'next/server'
import { requiredEnv } from '@/lib/env'

type PendingCookie = {
  name: string
  value: string
  options: CookieOptions
}

export function createRouteClient(request: NextRequest) {
  const pendingCookies: PendingCookie[] = []

  const supabase = createServerClient(requiredEnv('NEXT_PUBLIC_SUPABASE_URL'), requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'), {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        pendingCookies.push(...cookiesToSet)
      }
    }
  })

  function applyAuthCookies(response: NextResponse) {
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options)
    })
    return response
  }

  return { supabase, applyAuthCookies }
}
