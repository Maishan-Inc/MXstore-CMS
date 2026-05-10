import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const CategorySchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1).regex(/^[a-z0-9-]+$/),
  icon: z.string().trim().min(1),
  sort_order: z.number().int().default(0),
  enabled: z.boolean().default(true)
})

export async function GET() {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('app_categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  await requireAdmin()
  const body = CategorySchema.parse(await request.json())
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('app_categories')
    .insert({
      name: body.name,
      slug: body.slug,
      icon: body.icon,
      sort_order: body.sort_order,
      enabled: body.enabled
    })
    .select('id')
    .single()

  if (error) return new NextResponse(error.message, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  await requireAdmin()
  const id = new URL(request.url).searchParams.get('id')
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return new NextResponse('缺少有效分类 id', { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('app_categories')
    .delete()
    .eq('id', parsed.data)

  if (error) return new NextResponse(error.message, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function PUT(request: Request) {
  await requireAdmin()
  const body = CategorySchema.extend({ id: z.string().uuid() }).parse(await request.json())
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('app_categories')
    .update({
      name: body.name,
      slug: body.slug,
      icon: body.icon,
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
