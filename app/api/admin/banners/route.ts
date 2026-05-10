import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const BannerSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  title: z.string().min(1),
  subtitle: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  image_openlist_domain: z.string().trim().optional().nullable(),
  cta_label: z.string().optional().nullable(),
  cta_href: z.string().optional().nullable(),
  placement: z.enum(['recommended', 'category']).default('recommended'),
  category_id: z.string().uuid().optional().nullable(),
  app_id: z.string().uuid().optional().nullable(),
  sort_order: z.number().int().default(0),
  enabled: z.boolean().default(true)
}).superRefine((value, ctx) => {
  if (value.placement === 'category' && !value.category_id) {
    ctx.addIssue({ code: 'custom', path: ['category_id'], message: '分类页轮播图必须选择分类' })
  }
})

export async function GET() {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('home_banners')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  await requireAdmin()
  const body = BannerSchema.parse(await request.json())
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('home_banners')
    .insert({
      title: body.title,
      subtitle: body.subtitle || null,
      image_url: body.image_url || null,
      image_openlist_domain: body.image_openlist_domain || null,
      cta_label: body.cta_label || null,
      cta_href: body.cta_href || null,
      placement: body.placement,
      category_id: body.placement === 'category' ? body.category_id : null,
      app_id: body.app_id || null,
      sort_order: body.sort_order,
      enabled: body.enabled
    })
    .select('id')
    .single()

  if (error) return new NextResponse(error.message, { status: 400 })
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  await requireAdmin()
  const body = BannerSchema.extend({ id: z.string().uuid() }).parse(await request.json())
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('home_banners')
    .update({
      title: body.title,
      subtitle: body.subtitle || null,
      image_url: body.image_url || null,
      image_openlist_domain: body.image_openlist_domain || null,
      cta_label: body.cta_label || null,
      cta_href: body.cta_href || null,
      placement: body.placement,
      category_id: body.placement === 'category' ? body.category_id : null,
      app_id: body.app_id || null,
      sort_order: body.sort_order,
      enabled: body.enabled,
      updated_at: new Date().toISOString()
    })
    .eq('id', body.id)
    .select('id')
    .single()

  if (error) return new NextResponse(error.message, { status: 400 })
  return NextResponse.json(data)
}
