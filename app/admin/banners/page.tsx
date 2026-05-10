import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { BannerManager } from '@/components/admin-content-managers'

export default async function AdminBannersPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()
  const [{ data, error }, { data: apps }, { data: categories }] = await Promise.all([
    supabase
      .from('home_banners')
      .select('id,title,subtitle,image_url,image_openlist_domain,cta_label,cta_href,placement,category_id,app_id,sort_order,enabled')
      .order('placement', { ascending: true })
      .order('sort_order', { ascending: true }),
    supabase
      .from('apps')
      .select('id,name,slug,logo_url')
      .eq('published', true)
      .order('name', { ascending: true }),
    supabase
      .from('app_categories')
      .select('id,name')
      .eq('enabled', true)
      .order('sort_order', { ascending: true })
  ])

  if (error) throw error

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">轮播图</h1>
        <p className="mt-2 text-sm text-slate-500">为推荐页和每个分类页单独配置轮播图，可绑定应用、上传图片或填写 OpenList 图片 URL。</p>
      </div>
      <BannerManager initialItems={data ?? []} apps={apps ?? []} categories={categories ?? []} />
    </div>
  )
}
