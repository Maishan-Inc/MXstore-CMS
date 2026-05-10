import { NextResponse } from 'next/server'
import { generateNonce } from 'siwe'
import { sealJson } from '@/lib/crypto'

export async function GET() {
  const nonce = generateNonce()
  let sealedNonce: string
  try {
    sealedNonce = sealJson({ nonce, issuedAt: Date.now() })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: 'NONCE_COOKIE_SEAL_FAILED',
        error: '钱包登录 nonce Cookie 加密失败',
        detail: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }

  const response = NextResponse.json({ ok: true, nonce })
  response.headers.set('Cache-Control', 'no-store')
  response.cookies.set('siwe_nonce', sealedNonce, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 10 * 60
  })

  return response
}
