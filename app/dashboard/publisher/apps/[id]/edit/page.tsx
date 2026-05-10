import { redirect, notFound } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { canPublishApps } from '@/lib/account'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminAppForm } from '@/components/admin-app-form'
import { normalizeAppPayload } from '@/lib/admin/apps'
import { isMissingAppDetailColumn, withAppDetailDefaults } from '@/lib/admin/app-detail-fields'

export default async function PublisherEditAppPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (!canPublishApps(user)) redirect('/dashboard')

  const { id } = await params
  const supabase = createAdminClient()
  const { data: categories } = await supabase
    .from('app_categories')
    .select('id,name')
    .eq('enabled', true)
    .order('sort_order', { ascending: true })

  let { data: app, error } = await supabase
    .from('apps')
    .select('id,name,slug,description,version,platform,logo_url,official_url,screenshot_urls,feature_highlights,changelog,release_date,language,license_name,system_requirements,rating_score,rating_count,download_count,developer_name,developer_avatar_url,category_id,download_permission,is_paid,price_cents,currency,published,created_by,app_links(id,name,input_url,file_size_bytes,charge_traffic,sort_order)')
    .eq('id', id)
    .eq('created_by', user.id)
    .maybeSingle()

  if (isMissingAppDetailColumn(error)) {
    const fallback = await supabase
      .from('apps')
      .select('id,name,slug,description,version,platform,logo_url,developer_name,developer_avatar_url,category_id,download_permission,is_paid,price_cents,currency,published,created_by,app_links(id,name,input_url,file_size_bytes,charge_traffic,sort_order)')
      .eq('id', id)
      .eq('created_by', user.id)
      .maybeSingle()
    app = withAppDetailDefaults(fallback.data)
    error = fallback.error
  } else {
    app = withAppDetailDefaults(app)
  }

  if (error) throw error

  if (!app) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">编辑应用</h1>
        <p className="mt-2 text-sm text-slate-500">仅可编辑自己创建的应用。</p>
      </div>

      <section className="card">
        <AdminAppForm
          mode="edit"
          appId={app.id}
          editBasePath="/dashboard/publisher/apps"
          initialValues={normalizeAppPayload(app)}
          categories={categories ?? []}
        />
      </section>
    </div>
  )
}
