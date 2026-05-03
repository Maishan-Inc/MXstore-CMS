import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatBytes } from '@/lib/format'

export default async function AdminStatisticsPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 7)
  const monthStart = new Date(now)
  monthStart.setMonth(monthStart.getMonth() - 1)

  const [
    appsResult,
    usersResult,
    totalDownloadsResult,
    todayDownloadsResult,
    weekDownloadsResult,
    monthDownloadsResult,
    confirmedPaymentsResult,
    totalTrafficResult,
    topAppsResult,
    recentDownloadsResult
  ] = await Promise.all([
    supabase.from('apps').select('id', { count: 'exact', head: true }),
    supabase.from('store_users').select('id', { count: 'exact', head: true }),
    supabase.from('download_sessions').select('id', { count: 'exact', head: true }),
    supabase.from('download_sessions').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    supabase.from('download_sessions').select('id', { count: 'exact', head: true }).gte('created_at', weekStart.toISOString()),
    supabase.from('download_sessions').select('id', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('user_traffic_ledger').select('delta_bytes'),
    supabase.from('download_sessions').select('app_id,apps(name)').limit(100),
    supabase.from('download_sessions').select('id,created_at,apps(name),app_links(name)').order('created_at', { ascending: false }).limit(20)
  ])

  const totalTraffic = (totalTrafficResult.data ?? []).reduce((sum, r) => sum + Number(r.delta_bytes), 0)
  const purchasedTraffic = (totalTrafficResult.data ?? []).filter((r) => r.delta_bytes > 0).reduce((sum, r) => sum + Number(r.delta_bytes), 0)
  const consumedTraffic = (totalTrafficResult.data ?? []).filter((r) => r.delta_bytes < 0).reduce((sum, r) => sum + Number(r.delta_bytes), 0)

  // Top downloaded apps
  const appDownloadCounts = new Map<string, { name: string; count: number }>()
  for (const ds of topAppsResult.data ?? []) {
    const appRecord = Array.isArray(ds.apps) ? ds.apps[0] : ds.apps
    const name = appRecord?.name ?? 'Unknown'
    const existing = appDownloadCounts.get(ds.app_id)
    if (existing) {
      existing.count++
    } else {
      appDownloadCounts.set(ds.app_id, { name, count: 1 })
    }
  }
  const topApps = [...appDownloadCounts.values()].sort((a, b) => b.count - a.count).slice(0, 10)

  const stats = [
    { label: '应用总数', value: String(appsResult.count ?? 0) },
    { label: '用户总数', value: String(usersResult.count ?? 0) },
    { label: '总下载次数', value: String(totalDownloadsResult.count ?? 0) },
    { label: '今日下载', value: String(todayDownloadsResult.count ?? 0) },
    { label: '本周下载', value: String(weekDownloadsResult.count ?? 0) },
    { label: '本月下载', value: String(monthDownloadsResult.count ?? 0) },
    { label: '已确认订单', value: String(confirmedPaymentsResult.count ?? 0) },
    { label: '总发放流量', value: formatBytes(purchasedTraffic) },
    { label: '总消耗流量', value: formatBytes(Math.abs(consumedTraffic)) },
    { label: '净流量余额', value: formatBytes(totalTraffic) }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">数据统计</h1>
        <p className="mt-2 text-sm text-slate-500">查看平台整体运营数据。</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">下载排行</h2>
          {topApps.length === 0 ? (
            <p className="text-sm text-slate-500">暂无下载数据。</p>
          ) : (
            <div className="space-y-3">
              {topApps.map((app, i) => (
                <div key={app.name} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">{i + 1}</span>
                    <span className="text-sm font-medium text-slate-900">{app.name}</span>
                  </div>
                  <span className="text-sm text-slate-500">{app.count} 次</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">最近下载</h2>
          {(recentDownloadsResult.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">暂无下载记录。</p>
          ) : (
            <div className="space-y-3">
              {recentDownloadsResult.data?.map((ds) => {
                const appRecord = Array.isArray(ds.apps) ? ds.apps[0] : ds.apps
                const linkRecord = Array.isArray(ds.app_links) ? ds.app_links[0] : ds.app_links
                return (
                  <div key={ds.id} className="rounded-xl border border-slate-200 px-4 py-3 text-sm">
                    <p className="font-medium text-slate-900">{appRecord?.name ?? '未知应用'}</p>
                    <p className="text-slate-500">{linkRecord?.name ?? '-'}</p>
                    <p className="text-xs text-slate-400">{new Date(ds.created_at).toLocaleString()}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
