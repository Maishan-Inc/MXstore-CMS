import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatBytes } from '@/lib/format'
import { getDashboardMetrics } from '@/lib/admin/dashboard'
import { getPaymentStatusTone } from '@/lib/admin/labels'

function badgeClass(tone: 'success' | 'danger' | 'muted' | 'info') {
  if (tone === 'success') return 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700'
  if (tone === 'danger') return 'rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700'
  if (tone === 'info') return 'rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700'
  return 'rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600'
}

export default async function AdminPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [appsResult, downloadsResult, paymentsResult, usersResult, recentPaymentsResult, domainsResult] = await Promise.all([
    supabase.from('apps').select('id', { count: 'exact', head: true }),
    supabase.from('download_sessions').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('store_users').select('id', { count: 'exact', head: true }),
    supabase.from('payments').select('id,tx_hash,status,amount_raw,chain_id,created_at,store_users(email,wallet_address),traffic_packages(name)').order('created_at', { ascending: false }).limit(8),
    supabase.from('token_domains').select('id,domain,enabled,sign_ttl_seconds').order('created_at', { ascending: false }).limit(6)
  ])

  const metrics = getDashboardMetrics({
    appCount: appsResult.count ?? 0,
    todayDownloadCount: downloadsResult.count ?? 0,
    confirmedPaymentCount: paymentsResult.count ?? 0,
    activeUserCount: usersResult.count ?? 0
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">管理员仪表盘</h1>
          <p className="mt-1 text-sm text-slate-500">查看应用、下载、支付和配置概览。</p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="card">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">最近订单</h2>
          </div>
          <div className="space-y-3">
            {recentPaymentsResult.data?.map((payment) => {
              const userRecord = Array.isArray(payment.store_users) ? payment.store_users[0] : payment.store_users
              const pkgRecord = Array.isArray(payment.traffic_packages) ? payment.traffic_packages[0] : payment.traffic_packages
              return (
                <div key={payment.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{pkgRecord?.name ?? '流量套餐'} · chain {payment.chain_id}</p>
                      <p className="mt-1 text-slate-500">{userRecord?.email ?? userRecord?.wallet_address ?? '未知用户'}</p>
                      <p className="mt-1 break-all text-xs text-slate-400">{payment.tx_hash}</p>
                    </div>
                    <span className={badgeClass(getPaymentStatusTone(payment.status))}>{payment.status}</span>
                  </div>
                </div>
              )
            })}
            {!recentPaymentsResult.data?.length ? <p className="text-sm text-slate-500">暂无订单记录。</p> : null}
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">下载配置概览</h2>
          </div>
          <div className="space-y-3">
            {domainsResult.data?.map((domain) => (
              <div key={domain.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">{domain.domain}</p>
                    <p className="mt-1 text-slate-500">TTL {domain.sign_ttl_seconds}s</p>
                  </div>
                  <span className={badgeClass(domain.enabled ? 'success' : 'muted')}>{domain.enabled ? '启用' : '停用'}</span>
                </div>
              </div>
            ))}
            {!domainsResult.data?.length ? <p className="text-sm text-slate-500">暂无域名配置。</p> : null}
          </div>
        </div>
      </section>
    </div>
  )
}
