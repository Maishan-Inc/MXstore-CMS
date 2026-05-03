import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { generateNonce } from 'siwe'
import { sealJson } from '@/lib/crypto'

export async function GET() {
  const nonce = generateNonce()
  const cookieStore = await cookies()
  cookieStore.set('siwe_nonce', sealJson({ nonce, issuedAt: Date.now() }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60
  })
  return NextResponse.json({ nonce })
}
