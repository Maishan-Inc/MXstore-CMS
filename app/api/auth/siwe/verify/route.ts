import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SiweMessage } from 'siwe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sealJson, unsealJson } from '@/lib/crypto'
import { WALLET_SESSION_COOKIE, upsertStoreUserProfile } from '@/lib/auth'
import { getNextRouteForUser } from '@/lib/account'

type NonceCookie = { nonce: string; issuedAt: number }

export async function POST(request: NextRequest) {
  const { message, signature } = await request.json()
  const cookieStore = await cookies()
  const nonceCookie = unsealJson<NonceCookie>(cookieStore.get('siwe_nonce')?.value)
  if (!nonceCookie?.nonce) return new NextResponse('Missing nonce', { status: 400 })

  const siwe = new SiweMessage(message)
  const result = await siwe.verify({
    signature,
    nonce: nonceCookie.nonce,
    domain: request.nextUrl.host
  })

  if (!result.success) return new NextResponse('Invalid signature', { status: 401 })

  const wallet = result.data.address.toLowerCase()
  const admin = createAdminClient()
  const user = await upsertStoreUserProfile(admin, {
    wallet_address: wallet,
    display_name: wallet
  }, {
    onConflict: 'wallet_address',
    lookupColumn: 'wallet_address',
    lookupValue: wallet
  })
  if (!user) throw new Error('Wallet user sync failed')

  cookieStore.set(WALLET_SESSION_COOKIE, sealJson({ userId: user.id, address: wallet, issuedAt: Date.now() }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })
  cookieStore.delete('siwe_nonce')
  return NextResponse.json({ ok: true, userId: user.id, address: wallet, role: user.role, next: getNextRouteForUser(user) })
}
