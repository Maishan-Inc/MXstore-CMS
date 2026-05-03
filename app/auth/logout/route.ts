import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { appUrl } from '@/lib/env'
import { WALLET_SESSION_COOKIE } from '@/lib/auth'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const cookieStore = await cookies()
  cookieStore.delete(WALLET_SESSION_COOKIE)
  return NextResponse.redirect(appUrl())
}
