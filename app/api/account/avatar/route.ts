import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_AVATAR_BYTES = 512 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

const AvatarSchema = z.object({
  avatar_url: z.string().min(1)
})

function parseDataUrl(value: string) {
  const match = /^data:([^;,]+);base64,([a-zA-Z0-9+/=]+)$/.exec(value)
  if (!match) return null
  return {
    mimeType: match[1],
    bytes: Buffer.byteLength(match[2], 'base64')
  }
}

export async function POST(request: Request) {
  const user = await requireUser()
  const parsed = AvatarSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return new NextResponse('头像数据无效', { status: 400 })

  const dataUrl = parseDataUrl(parsed.data.avatar_url)
  if (!dataUrl) return new NextResponse('请上传有效的 base64 图片', { status: 400 })
  if (!ALLOWED_MIME_TYPES.has(dataUrl.mimeType)) return new NextResponse('头像仅支持 PNG、JPG、WebP 或 GIF', { status: 400 })
  if (dataUrl.bytes > MAX_AVATAR_BYTES) return new NextResponse('头像不能超过 512KB', { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('store_users')
    .update({
      avatar_url: parsed.data.avatar_url,
      avatar_source: 'custom',
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json({ ok: true })
}

