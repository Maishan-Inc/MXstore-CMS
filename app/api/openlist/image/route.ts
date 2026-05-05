import { NextRequest, NextResponse } from 'next/server'
import { makeSignedOpenListUrl } from '@/lib/openlist'

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url')
  if (!rawUrl) return new NextResponse('Missing url', { status: 400 })

  let target: URL
  try {
    target = new URL(rawUrl)
  } catch {
    return new NextResponse('Invalid url', { status: 400 })
  }

  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return new NextResponse('Invalid url', { status: 400 })
  }

  try {
    const signed = await makeSignedOpenListUrl(rawUrl)
    const response = NextResponse.redirect(signed.url, 302)
    response.headers.set('Cache-Control', 'no-store')
    return response
  } catch {
    const response = NextResponse.redirect(rawUrl, 302)
    response.headers.set('Cache-Control', 'no-store')
    return response
  }
}
