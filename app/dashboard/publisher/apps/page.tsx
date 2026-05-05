import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { canPublishApps, getDeveloperProfile } from '@/lib/account'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminAppForm } from '@/components/admin-app-form'
import { appFormDefaults } from '@/lib/admin/apps'

export default async function PublisherAppsPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (!canPublishApps(user)) redirect('/dashboard')

  const supabase = createAdminClient()
  const [{ data: apps }, { data: categories }] = await Promise.all([
    supabase
      .from('apps')
      .select('id,name,slug,version,platform,published,is_paid,price_cents,currency,created_at,developer_name,developer_avatar_url,app_links(id),created_by')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('app_categories')
      .select('id,name')
      .eq('enabled', true)
      .order('sort_order', { ascending: true })
  ])

  const profile = getDeveloperProfile(user)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">发布应用</h1>
        <p className="mt-2 text-sm text-slate-500">个人用户不可见，只有独立开发者及以上账户才能使用。</p>
      </div>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">新增应用</h2>
        <AdminAppForm
          editBasePath="/dashboard/publisher/apps"
          initialValues={{
            ...appFormDefaults(),
            developer_name: profile.name,
            developer_avatar_url: profile.avatarUrl ?? ''
          }}
          categories={categories ?? []}
        />
      </section>

      <section className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">应用</th>
                <th className="px-5 py-3 font-medium">开发者</th>
                <th className="px-5 py-3 font-medium">版本 / 分类</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
              {apps?.map((app) => (
                <tr key={app.id}>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{app.name}</p>
                      <p className="text-xs text-slate-500">/{app.slug}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{app.developer_name ?? '-'}</td>
                  <td className="px-5 py-4 text-slate-500">{app.version ?? '未设置'} · {app.platform ?? '未分类'}</td>
                  <td className="px-5 py-4">
                    <span className={app.published ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700' : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600'}>
                      {app.published ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/dashboard/publisher/apps/${app.id}/edit`} className="text-blue-600 hover:text-blue-700">编辑</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!apps?.length ? <p className="px-5 py-8 text-sm text-slate-500">还没有应用，先创建第一个应用。</p> : null}
      </section>
    </div>
  )
}
