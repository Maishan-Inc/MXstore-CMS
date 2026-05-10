import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronRight, Star } from 'lucide-react'
import { StoreAppIconLink } from '@/components/store-app-icon-link'
import { getCategoryIcon } from '@/lib/category-icons'
import { signedImageSrc } from '@/lib/openlist-image'

export const dynamic = 'force-dynamic'

type CategoryApp = {
  name: string
  slug: string
  logo_url: string | null
}

type Category = {
  id: string
  name: string
  slug: string
  icon: string
  enabled: boolean
}

type CategoryBanner = {
  title: string
  subtitle: string | null
  image_url: string | null
  image_openlist_domain?: string | null
  cta_label: string | null
  cta_href: string | null
}

const appTones = [
  'from-blue-500 to-slate-900',
  'from-slate-950 to-slate-800',
  'from-orange-500 to-slate-900',
  'from-emerald-400 to-emerald-600',
  'from-teal-500 to-slate-900',
  'from-blue-400 to-slate-900',
  'from-slate-950 to-black',
  'from-blue-500 to-slate-900'
]

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    redirect('/install')
  }

  const { slug } = await params
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  const { data: category, error: categoryError } = await supabase
    .from('app_categories')
    .select('id,name,slug,icon,enabled')
    .eq('slug', slug)
    .maybeSingle()

  if (categoryError) throw categoryError
  if (!category || !category.enabled) notFound()

  const [{ data: apps, error: appsError }, { data: banners }] = await Promise.all([
    supabase
      .from('apps')
      .select('name,slug,logo_url')
      .eq('published', true)
      .eq('category_id', (category as Category).id)
      .order('created_at', { ascending: false }),
    supabase
      .from('home_banners')
      .select('title,subtitle,image_url,image_openlist_domain,cta_label,cta_href')
      .eq('enabled', true)
      .eq('placement', 'category')
      .eq('category_id', (category as Category).id)
      .order('sort_order', { ascending: true })
      .limit(5)
  ])

  if (appsError) throw appsError

  const Icon = getCategoryIcon((category as Category).icon)
  const primaryBanner = (banners?.[0] as CategoryBanner | undefined) ?? {
    title: (category as Category).name,
    subtitle: `${apps?.length ?? 0} 个已发布应用`,
    image_url: null,
    cta_label: '浏览应用',
    cta_href: '#category-apps'
  }

  return (
    <div className="space-y-8">
      <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#868685]">
        <Link href="/" className="hover:text-[#163300]">首页</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/apps" className="hover:text-[#163300]">应用</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[#0e0f0c]">{(category as Category).name}</span>
      </nav>

      <section className="relative min-h-[360px] overflow-hidden rounded-[36px] border border-[#0e0f0c]/10 bg-white p-7 wise-ring md:min-h-[460px]">
        <div className="relative z-10 flex min-h-[300px] max-w-2xl flex-col justify-center md:min-h-[400px]">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#e2f6d5] text-[#163300] wise-ring">
              <Icon className="h-7 w-7" />
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#e2f6d5] px-4 py-2 text-sm font-black text-[#163300]">
              <Star className="h-4 w-4 fill-current" />
              分类轮播
            </span>
          </div>
          <h1 className="wise-display mt-8 text-[52px] text-[#0e0f0c] md:text-[82px]">{primaryBanner.title}</h1>
          <p className="mt-6 text-xl font-semibold leading-8 text-[#454745]">{primaryBanner.subtitle ?? `${apps?.length ?? 0} 个已发布应用`}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={primaryBanner.cta_href ?? '#category-apps'} className="wise-button px-7 py-4 text-base font-black">
              {primaryBanner.cta_label ?? '浏览应用'}
            </Link>
            <Link href="/apps" className="wise-subtle-button px-7 py-4 text-base font-black">查看全部应用</Link>
          </div>
        </div>
        {primaryBanner.image_url ? (
          <div className="absolute inset-y-0 right-0 hidden w-[48%] items-center justify-center p-8 md:flex">
            <img src={signedImageSrc(primaryBanner.image_url, primaryBanner.image_openlist_domain) ?? primaryBanner.image_url} alt="" className="h-full max-h-[360px] w-full rounded-[34px] object-cover wise-ring" />
          </div>
        ) : null}
        {banners?.length ? (
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3">
            {banners.map((banner: CategoryBanner, index: number) => (
              <span key={`${banner.title}-${index}`} className={`h-3 w-3 rounded-full ${index === 0 ? 'bg-[#9fe870]' : 'bg-[#cdd2ca]'}`} />
            ))}
          </div>
        ) : null}
      </section>

      {apps?.length ? (
        <div id="category-apps" className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
          {apps.map((app: CategoryApp, index: number) => (
            <StoreAppIconLink
              key={app.slug}
              app={app}
              icon={Icon}
              tone={appTones[index % appTones.length]}
            />
          ))}
        </div>
      ) : (
        <p className="rounded-[30px] border border-[#0e0f0c]/10 bg-white px-5 py-8 text-sm font-semibold text-[#868685] wise-ring">该分类下暂无已发布应用。</p>
      )}
    </div>
  )
}
