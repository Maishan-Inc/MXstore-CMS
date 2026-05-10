import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin, requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { findTokenDomainByUrl } from '@/lib/openlist'
import { canPublishApps, getDeveloperProfile } from '@/lib/account'

const LinkSchema = z.object({
  id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1),
  input_url: z.string().trim().url(),
  file_size_bytes: z.number().int().nonnegative().nullable().optional(),
  charge_traffic: z.boolean().default(true),
  sort_order: z.number().int().default(0)
})

const AppSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().optional().nullable(),
  version: z.string().trim().optional().nullable(),
  platform: z.string().trim().optional().nullable(),
  logo_url: z.string().trim().url().optional().or(z.literal('')).nullable(),
  developer_name: z.string().trim().optional().nullable(),
  developer_avatar_url: z.string().trim().url().optional().or(z.literal('')).nullable(),
  category_id: z.string().uuid().optional().or(z.literal('')).nullable(),
  download_permission: z.enum(['public', 'login', 'purchase']).default('login'),
  is_paid: z.boolean().default(false),
  price_cents: z.number().int().min(0).default(0),
  currency: z.string().trim().min(3).max(8).default('USD'),
  published: z.boolean().default(false),
  links: z.array(LinkSchema).min(1)
})

async function buildLinks(appId: string, links: z.infer<typeof LinkSchema>[]) {
  return Promise.all(
    links.map(async (link) => {
      const matchedDomain = await findTokenDomainByUrl(link.input_url)
      return {
        id: link.id ?? undefined,
        app_id: appId,
        name: link.name,
        input_url: link.input_url,
        link_kind: matchedDomain ? 'openlist' : 'external',
        token_domain_id: matchedDomain?.id ?? null,
        file_size_bytes: link.file_size_bytes && link.file_size_bytes > 0 ? link.file_size_bytes : null,
        charge_traffic: link.charge_traffic,
        sort_order: link.sort_order
      }
    })
  )
}

async function writeLinks(appId: string, links: z.infer<typeof LinkSchema>[]) {
  const supabase = createAdminClient()
  const builtLinks = await buildLinks(appId, links)
  const idsToKeep = builtLinks.flatMap((link) => (link.id ? [link.id] : []))
  const linksToUpdate = builtLinks.filter((link) => link.id)
  const linksToInsert = builtLinks.filter((link) => !link.id).map(({ id, ...link }) => link)

  if (idsToKeep.length) {
    const { data: existingLinks, error: existingError } = await supabase
      .from('app_links')
      .select('id')
      .eq('app_id', appId)
    if (existingError) throw existingError

    const staleIds = (existingLinks ?? []).map((link) => link.id).filter((id) => !idsToKeep.includes(id))
    if (staleIds.length) {
      const { error: deleteError } = await supabase.from('app_links').delete().in('id', staleIds)
      if (deleteError) throw deleteError
    }
  } else {
    const { error: deleteError } = await supabase.from('app_links').delete().eq('app_id', appId)
    if (deleteError) throw deleteError
  }

  if (linksToUpdate.length) {
    const { error: upsertError } = await supabase.from('app_links').upsert(linksToUpdate, { onConflict: 'id' })
    if (upsertError) throw upsertError
  }

  if (linksToInsert.length) {
    const { error: insertError } = await supabase.from('app_links').insert(linksToInsert)
    if (insertError) throw insertError
  }
}

export async function GET() {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('apps')
    .select('id,name,slug,version,platform,published,is_paid,price_cents,currency,created_at,app_links(id)')
    .order('created_at', { ascending: false })

  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const user = await requireUser()
  if (user.role !== 'admin' && !canPublishApps(user)) {
    return new NextResponse('当前身份没有应用发布权限', { status: 403 })
  }
  const parsed = AppSchema.safeParse(await request.json())
  if (!parsed.success) return new NextResponse(parsed.error.issues[0]?.message ?? '应用数据不完整', { status: 400 })

  const body = parsed.data
  const supabase = createAdminClient()
  const userProfile = user.role === 'admin' ? null : getDeveloperProfile(user)
  const developerName = user.role === 'admin' ? body.developer_name || body.name : userProfile?.name ?? body.name
  const developerAvatarUrl = user.role === 'admin' ? body.developer_avatar_url || null : userProfile?.avatarUrl ?? null

  const { data: app, error: appError } = await supabase
    .from('apps')
    .insert({
      name: body.name,
      slug: body.slug,
      description: body.description,
      version: body.version,
      platform: body.platform,
      logo_url: body.logo_url || null,
      category_id: body.category_id || null,
      download_permission: body.download_permission,
      is_paid: body.download_permission === 'purchase' || body.is_paid,
      price_cents: body.price_cents,
      currency: body.currency,
      developer_name: developerName,
      developer_avatar_url: developerAvatarUrl,
      published: body.published,
      created_by: user.id
    })
    .select('id,slug')
    .single()

  if (appError) return new NextResponse(appError.message, { status: 400 })

  try {
    await writeLinks(app.id, body.links)
  } catch (error) {
    await supabase.from('apps').delete().eq('id', app.id)
    return new NextResponse(error instanceof Error ? error.message : '保存下载链接失败', { status: 400 })
  }

  return NextResponse.json({ id: app.id, slug: app.slug })
}

export async function PUT(request: Request) {
  const user = await requireUser()
  if (user.role !== 'admin' && !canPublishApps(user)) {
    return new NextResponse('当前身份没有应用发布权限', { status: 403 })
  }
  const appId = new URL(request.url).searchParams.get('id')
  if (!appId) return new NextResponse('缺少应用 id', { status: 400 })

  const parsed = AppSchema.safeParse(await request.json())
  if (!parsed.success) return new NextResponse(parsed.error.issues[0]?.message ?? '应用数据不完整', { status: 400 })

  const body = parsed.data
  const supabase = createAdminClient()
  const { data: existingApp, error: existingError } = await supabase
    .from('apps')
    .select('id,created_by')
    .eq('id', appId)
    .maybeSingle()

  if (existingError) return new NextResponse(existingError.message, { status: 500 })
  if (!existingApp) return new NextResponse('应用不存在', { status: 404 })
  if (user.role !== 'admin' && existingApp.created_by !== user.id) {
    return new NextResponse('只能编辑自己创建的应用', { status: 403 })
  }

  const userProfile = user.role === 'admin' ? null : getDeveloperProfile(user)
  const developerName = user.role === 'admin' ? body.developer_name || body.name : userProfile?.name ?? body.name
  const developerAvatarUrl = user.role === 'admin' ? body.developer_avatar_url || null : userProfile?.avatarUrl ?? null

  const { data: app, error: appError } = await supabase
    .from('apps')
    .update({
      name: body.name,
      slug: body.slug,
      description: body.description,
      version: body.version,
      platform: body.platform,
      logo_url: body.logo_url || null,
      category_id: body.category_id || null,
      download_permission: body.download_permission,
      is_paid: body.download_permission === 'purchase' || body.is_paid,
      price_cents: body.price_cents,
      currency: body.currency,
      developer_name: developerName,
      developer_avatar_url: developerAvatarUrl,
      published: body.published,
      updated_at: new Date().toISOString()
    })
    .eq('id', appId)
    .select('id,slug')
    .single()

  if (appError) return new NextResponse(appError.message, { status: 400 })

  try {
    await writeLinks(app.id, body.links)
  } catch (error) {
    return new NextResponse(error instanceof Error ? error.message : '保存下载链接失败', { status: 400 })
  }

  return NextResponse.json({ id: app.id, slug: app.slug })
}
