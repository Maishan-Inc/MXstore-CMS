import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SiweMessage } from 'siwe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sealJson, unsealJsonResult } from '@/lib/crypto'
import { WALLET_SESSION_COOKIE, upsertStoreUserProfile } from '@/lib/auth'
import { getNextRouteForUser } from '@/lib/account'

const SIWE_NONCE_COOKIE = 'siwe_nonce'
const NONCE_MAX_AGE_MS = 10 * 60 * 1000

type NonceCookie = { nonce: string; issuedAt: number }

type VerifyErrorCode =
  | 'BAD_REQUEST'
  | 'NONCE_MISSING'
  | 'NONCE_COOKIE_INVALID'
  | 'NONCE_EXPIRED'
  | 'SIWE_MESSAGE_INVALID'
  | 'SIWE_DOMAIN_MISMATCH'
  | 'SIGNATURE_INVALID'
  | 'STORE_USER_UPSERT_FAILED'
  | 'WALLET_SESSION_SEAL_FAILED'

function errorResponse(status: number, code: VerifyErrorCode, error: string, detail?: string) {
  return NextResponse.json({ ok: false, code, error, detail }, { status })
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeHost(value?: string | null) {
  const firstValue = value?.split(',')[0]?.trim()
  if (!firstValue) return null

  try {
    const url = firstValue.includes('://') ? new URL(firstValue) : new URL(`https://${firstValue}`)
    return url.host.toLowerCase()
  } catch {
    return firstValue.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase()
  }
}

function addHost(hosts: Set<string>, value?: string | null) {
  const normalized = normalizeHost(value)
  if (normalized) hosts.add(normalized)
}

function allowedSiweDomains(request: NextRequest) {
  const hosts = new Set<string>()
  addHost(hosts, request.headers.get('x-vercel-forwarded-host'))
  addHost(hosts, request.headers.get('x-forwarded-host'))
  addHost(hosts, request.headers.get('host'))
  addHost(hosts, request.nextUrl.host)
  addHost(hosts, request.headers.get('origin'))
  addHost(hosts, request.headers.get('referer'))
  addHost(hosts, process.env.NEXT_PUBLIC_SITE_URL)
  addHost(hosts, process.env.NEXT_PUBLIC_APP_URL)
  addHost(hosts, process.env.VERCEL_URL)
  return hosts
}

function isNonceCookie(value: unknown): value is NonceCookie {
  return isRecord(value) && typeof value.nonce === 'string' && typeof value.issuedAt === 'number'
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch (error) {
    return errorResponse(400, 'BAD_REQUEST', '请求体不是有效 JSON', getErrorMessage(error))
  }

  if (!isRecord(body) || typeof body.message !== 'string' || typeof body.signature !== 'string') {
    return errorResponse(400, 'BAD_REQUEST', '缺少 SIWE message 或 signature')
  }

  const cookieStore = await cookies()
  const nonceResult = unsealJsonResult<NonceCookie>(cookieStore.get(SIWE_NONCE_COOKIE)?.value)
  if (!nonceResult.ok) {
    const code = nonceResult.reason === 'missing' ? 'NONCE_MISSING' : 'NONCE_COOKIE_INVALID'
    const message = nonceResult.reason === 'missing' ? 'SIWE nonce Cookie 缺失' : 'SIWE nonce Cookie 解密失败'
    return errorResponse(code === 'NONCE_MISSING' ? 400 : 401, code, message, nonceResult.message)
  }

  if (!isNonceCookie(nonceResult.value)) {
    return errorResponse(401, 'NONCE_COOKIE_INVALID', 'SIWE nonce Cookie 内容无效')
  }

  if (Date.now() - nonceResult.value.issuedAt > NONCE_MAX_AGE_MS) {
    return errorResponse(401, 'NONCE_EXPIRED', 'SIWE nonce 已过期，请重新发起钱包登录')
  }

  let siwe: SiweMessage
  try {
    siwe = new SiweMessage(body.message)
  } catch (error) {
    return errorResponse(400, 'SIWE_MESSAGE_INVALID', 'SIWE message 格式无效', getErrorMessage(error))
  }

  const messageDomain = normalizeHost(siwe.domain)
  const allowedDomains = allowedSiweDomains(request)
  if (!messageDomain || !allowedDomains.has(messageDomain)) {
    return errorResponse(
      401,
      'SIWE_DOMAIN_MISMATCH',
      'SIWE domain 与当前访问域名不一致',
      `message domain: ${siwe.domain}; allowed domains: ${Array.from(allowedDomains).join(', ')}`
    )
  }

  let verifyResult: Awaited<ReturnType<SiweMessage['verify']>>
  try {
    verifyResult = await siwe.verify({
      signature: body.signature,
      nonce: nonceResult.value.nonce,
      domain: siwe.domain
    })
  } catch (error) {
    return errorResponse(401, 'SIGNATURE_INVALID', '钱包签名验证失败', getErrorMessage(error))
  }

  if (!verifyResult.success) {
    return errorResponse(401, 'SIGNATURE_INVALID', '钱包签名无效', 'SIWE verify returned success=false')
  }

  const wallet = verifyResult.data.address.toLowerCase()
  const admin = createAdminClient()
  let user: Awaited<ReturnType<typeof upsertStoreUserProfile>>
  try {
    user = await upsertStoreUserProfile(admin, {
      wallet_address: wallet,
      display_name: wallet
    }, {
      onConflict: 'wallet_address',
      lookupColumn: 'wallet_address',
      lookupValue: wallet
    })
  } catch (error) {
    return errorResponse(500, 'STORE_USER_UPSERT_FAILED', '数据库用户资料同步失败', getErrorMessage(error))
  }

  if (!user) {
    return errorResponse(500, 'STORE_USER_UPSERT_FAILED', '数据库用户资料同步后未返回用户')
  }

  let walletSession: string
  try {
    walletSession = sealJson({ userId: user.id, address: wallet, issuedAt: Date.now() })
  } catch (error) {
    return errorResponse(500, 'WALLET_SESSION_SEAL_FAILED', '钱包登录 Session Cookie 加密失败', getErrorMessage(error))
  }

  const response = NextResponse.json({
    ok: true,
    userId: user.id,
    address: wallet,
    role: user.role,
    next: getNextRouteForUser(user)
  })
  response.cookies.set(WALLET_SESSION_COOKIE, walletSession, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })
  response.cookies.set(SIWE_NONCE_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  })

  return response
}
