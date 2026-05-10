import { notFound, redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminAppForm } from '@/components/admin-app-form'
import { normalizeAppPayload } from '@/lib/admin/apps'
import { isMissingAppDetailColumn, withAppDetailDefaults } from '@/lib/admin/app-detail-fields'

export default async function EditAppPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const { id } = await params
  const supabase = createAdminClient()
  let { data: app, error } = await supabase
    .from('apps')
    .select('id,name,slug,description,version,platform,logo_url,official_url,screenshot_urls,feature_highlights,changelog,release_date,language,license_name,system_requirements,rating_score,rating_count,download_count,developer_name,developer_avatar_url,category_id,download_permission,is_paid,price_cents,currency,published,app_links(id,name,input_url,file_size_bytes,charge_traffic,sort_order)')
    .eq('id', id)
    .maybeSingle()

  if (isMissingAppDetailColumn(error)) {
    const fallback = await supabase
      .from('apps')
      .select('id,name,slug,description,version,platform,logo_url,developer_name,developer_avatar_url,category_id,download_permission,is_paid,price_cents,currency,published,app_links(id,name,input_url,file_size_bytes,charge_traffic,sort_order)')
      .eq('id', id)
      .maybeSingle()
    app = withAppDetailDefaults(fallback.data)
    error = fallback.error
  } else {
    app = withAppDetailDefaults(app)
  }
  const { data: categories } = await supabase
    .from('app_categories')
    .select('id,name')
    .eq('enabled', true)
    .order('sort_order', { ascending: true })

  if (error) throw error
  if (!app) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">编辑应用</h1>
        <p className="mt-2 text-sm text-slate-500">更新应用信息、价格、发布状态和下载链接配置。</p>
      </div>
      <AdminAppForm mode="edit" appId={app.id} initialValues={normalizeAppPayload(app)} categories={categories ?? []} />
    </div>
  )
}
