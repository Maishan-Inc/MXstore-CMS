import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { BannerManager } from '@/components/admin-content-managers'

export default async function AdminBannersPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('home_banners')
    .select('id,title,subtitle,image_url,cta_label,cta_href,sort_order,enabled')
    .order('sort_order', { ascending: true })

  if (error) throw error

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">首页轮播图</h1>
        <p className="mt-2 text-sm text-slate-500">新增和修改首页首屏轮播内容，支持图片 URL 或本地上传。</p>
      </div>
      <BannerManager initialItems={data ?? []} />
    </div>
  )
}

