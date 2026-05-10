import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { StoreAppIconLink } from '@/components/store-app-icon-link'
import { getCategoryIcon } from '@/lib/category-icons'

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

  const { data: apps, error: appsError } = await supabase
    .from('apps')
    .select('name,slug,logo_url')
    .eq('published', true)
    .eq('category_id', (category as Category).id)
    .order('created_at', { ascending: false })
    .limit(96)

  if (appsError) throw appsError

  const Icon = getCategoryIcon((category as Category).icon)

  return (
    <div className="space-y-8">
      <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#868685]">
        <Link href="/" className="hover:text-[#163300]">首页</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/apps" className="hover:text-[#163300]">应用</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-[#0e0f0c]">{(category as Category).name}</span>
      </nav>

      <section className="rounded-[36px] border border-[#0e0f0c]/10 bg-white p-7 wise-ring">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#e2f6d5] text-[#163300] wise-ring">
              <Icon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="wise-display text-[52px] text-[#0e0f0c]">{(category as Category).name}</h1>
              <p className="mt-3 text-sm font-semibold text-[#868685]">{apps?.length ?? 0} 个已发布应用</p>
            </div>
          </div>
          <Link href="/apps" className="wise-subtle-button px-5 py-3 text-sm font-black">查看全部应用</Link>
        </div>
      </section>

      {apps?.length ? (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
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
