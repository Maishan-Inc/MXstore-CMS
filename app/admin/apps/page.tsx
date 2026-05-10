import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatMoney } from '@/lib/format'

export default async function AdminAppsPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()
  const { data: apps } = await supabase
    .from('apps')
    .select('id,name,slug,version,platform,published,is_paid,price_cents,currency,created_at,app_links(id)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">应用管理</h1>
          <p className="mt-2 text-sm text-slate-500">集中管理应用信息、价格、发布状态和下载链接。</p>
        </div>
        <Link href="/admin/apps/new" className="btn">新增应用</Link>
      </div>

      <section className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">应用</th>
                <th className="px-5 py-3 font-medium">版本 / 分类</th>
                <th className="px-5 py-3 font-medium">价格</th>
                <th className="px-5 py-3 font-medium">下载链接</th>
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
                  <td className="px-5 py-4 text-slate-500">{app.version ?? '未设置'} · {app.platform ?? '未分类'}</td>
                  <td className="px-5 py-4 text-slate-500">{app.is_paid ? formatMoney(app.price_cents, app.currency ?? 'USD') : '免费'}</td>
                  <td className="px-5 py-4 text-slate-500">{app.app_links?.length ?? 0} 个</td>
                  <td className="px-5 py-4">
                    <span className={app.published ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700' : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600'}>
                      {app.published ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-3">
                      <Link href={`/app/${app.slug}`} className="text-slate-500 hover:text-slate-900">查看</Link>
                      <Link href={`/admin/apps/${app.id}/edit`} className="font-semibold text-[#163300] hover:text-[#0e0f0c]">编辑</Link>
                    </div>
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
