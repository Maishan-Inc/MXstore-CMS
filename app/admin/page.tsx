import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ChevronRight,
  Copy,
  Download,
  Grid2X2,
  Settings,
  ShoppingCart,
  Users,
  type LucideIcon
} from 'lucide-react'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getDashboardMetrics } from '@/lib/admin/dashboard'
import { getPaymentStatusTone } from '@/lib/admin/labels'

type BadgeTone = 'success' | 'danger' | 'muted' | 'info' | 'warning'
type PaymentStatus = 'pending' | 'confirmed' | 'rejected'

const appIconClasses = [
  'bg-[#0e0f0c] text-white',
  'bg-[#9fe870] text-[#163300]',
  'bg-[#38c8ff]/20 text-[#0e0f0c]',
  'bg-[#ffc091] text-[#0e0f0c]',
  'bg-[#454745] text-white',
  'bg-[#e2f6d5] text-[#163300]'
]

function badgeClass(tone: BadgeTone) {
  if (tone === 'success') return 'rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700'
  if (tone === 'danger') return 'rounded-md bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700'
  if (tone === 'info') return 'rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700'
  if (tone === 'warning') return 'rounded-md bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700'
  return 'rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600'
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('zh-CN').format(value)
}

function formatDateTime(value?: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(value)).replace(/\//g, '-')
}

function normalizePaymentStatus(status: string): PaymentStatus {
  if (status === 'confirmed' || status === 'rejected') return status
  return 'pending'
}

function paymentStatusLabel(status: PaymentStatus) {
  if (status === 'confirmed') return '已支付'
  if (status === 'rejected') return '已退款'
  return '待确认'
}

function appStatusBadge(published: boolean) {
  return published
    ? { tone: 'success' as const, label: '已上架' }
    : { tone: 'info' as const, label: '审核中' }
}

function MetricCard({
  label,
  value,
  Icon,
  iconClass
}: {
  label: string
  value: string
  Icon: LucideIcon
  iconClass: string
}) {
  return (
    <div className="rounded-[30px] border border-[#0e0f0c]/10 bg-white p-7 wise-ring">
      <div className="flex items-center gap-7">
        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${iconClass}`}>
          <Icon className="h-8 w-8" strokeWidth={2.2} />
        </div>
        <div>
          <p className="text-base font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default async function AdminPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    appsResult,
    downloadsResult,
    paymentsResult,
    usersResult,
    recentPaymentsResult,
    domainsResult,
    appListResult
  ] = await Promise.all([
    supabase.from('apps').select('id', { count: 'exact', head: true }),
    supabase.from('download_sessions').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabase.from('store_users').select('id', { count: 'exact', head: true }),
    supabase.from('payments').select('id,tx_hash,status,amount_raw,chain_id,created_at,store_users(email,wallet_address),traffic_packages(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('token_domains').select('id,domain,openlist_base_url,enabled,sign_ttl_seconds').order('created_at', { ascending: false }).limit(4),
    supabase.from('apps').select('id,name,version,platform,published,created_at').order('created_at', { ascending: false }).limit(6)
  ])

  const metrics = getDashboardMetrics({
    appCount: appsResult.count ?? 0,
    todayDownloadCount: downloadsResult.count ?? 0,
    confirmedPaymentCount: paymentsResult.count ?? 0,
    activeUserCount: usersResult.count ?? 0
  })

  const metricIcons = [
    { Icon: Grid2X2, iconClass: 'bg-blue-50 text-blue-600' },
    { Icon: Download, iconClass: 'bg-emerald-50 text-emerald-600' },
    { Icon: ShoppingCart, iconClass: 'bg-violet-50 text-violet-600' },
    { Icon: Users, iconClass: 'bg-orange-50 text-orange-600' }
  ]
  const primaryDomain = domainsResult.data?.[0]

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
        {metrics.map((metric, index) => {
          const icon = metricIcons[index] ?? metricIcons[0]
          return (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={formatCompactNumber(Number(metric.value))}
              Icon={icon.Icon}
              iconClass={icon.iconClass}
            />
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.95fr)]">
        <div className="overflow-hidden rounded-[30px] border border-[#0e0f0c]/10 bg-white wise-ring">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <h1 className="text-xl font-semibold text-slate-950">应用列表</h1>
            <Link
              href="/admin/apps"
              className="wise-subtle-button inline-flex h-10 items-center gap-2 px-4 text-sm font-semibold"
            >
              查看全部
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-medium">应用名称</th>
                  <th className="px-6 py-4 font-medium">分类</th>
                  <th className="px-6 py-4 font-medium">版本</th>
                  <th className="px-6 py-4 font-medium">状态</th>
                  <th className="px-6 py-4 font-medium">下载量</th>
                  <th className="px-6 py-4 font-medium">更新时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {appListResult.data?.map((app, index) => {
                  const status = appStatusBadge(Boolean(app.published))
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${appIconClasses[index % appIconClasses.length]}`}>
                            {app.name.slice(0, 1).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-950">{app.name}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">{app.platform ?? '未分类'}</td>
                      <td className="whitespace-nowrap px-6 py-4">{app.version ?? '-'}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={badgeClass(status.tone)}>{status.label}</span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">-</td>
                      <td className="whitespace-nowrap px-6 py-4">{formatDateTime(app.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {!appListResult.data?.length ? <p className="px-6 py-10 text-sm text-slate-500">暂无应用，创建应用后会显示在这里。</p> : null}
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-[30px] border border-[#0e0f0c]/10 bg-white wise-ring">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-semibold text-slate-950">下载配置概览</h2>
              <Link href="/admin/settings/domains" aria-label="域名与 Token 设置" className="text-slate-500 hover:text-slate-950">
                <Settings className="h-5 w-5" />
              </Link>
            </div>
            <div className="divide-y divide-slate-200">
              <div className="grid grid-cols-[130px_minmax(0,1fr)_auto] items-center gap-3 px-6 py-3.5 text-sm">
                <span className="text-slate-600">主下载域名</span>
                <span className="truncate text-right font-medium text-slate-800">{primaryDomain?.domain ?? '未配置'}</span>
                <Copy className="h-4 w-4 text-slate-500" />
              </div>
              <div className="grid grid-cols-[130px_minmax(0,1fr)] items-center gap-3 px-6 py-3.5 text-sm">
                <span className="text-slate-600">CDN 状态</span>
                <span className="text-right"><span className={badgeClass(primaryDomain?.enabled ? 'success' : 'muted')}>{primaryDomain?.enabled ? '正常' : '未启用'}</span></span>
              </div>
              <div className="grid grid-cols-[130px_minmax(0,1fr)] items-center gap-3 px-6 py-3.5 text-sm">
                <span className="text-slate-600">签名验证</span>
                <span className="text-right"><span className={badgeClass(primaryDomain ? 'success' : 'muted')}>{primaryDomain ? '已开启' : '未配置'}</span></span>
              </div>
              <div className="grid grid-cols-[130px_minmax(0,1fr)_auto] items-center gap-3 px-6 py-3.5 text-sm">
                <span className="text-slate-600">OpenList 地址</span>
                <span className="truncate text-right font-medium text-slate-800">{primaryDomain?.openlist_base_url ?? '-'}</span>
                <Copy className="h-4 w-4 text-slate-500" />
              </div>
              <div className="grid grid-cols-[130px_minmax(0,1fr)] items-center gap-3 px-6 py-3.5 text-sm">
                <span className="text-slate-600">Token 状态</span>
                <span className="text-right"><span className={badgeClass(primaryDomain ? 'success' : 'muted')}>{primaryDomain ? '有效' : '未配置'}</span></span>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-[#0e0f0c]/10 bg-white wise-ring">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-950">最近订单</h2>
              <Link href="/admin/orders" className="wise-subtle-button px-4 py-2 text-sm font-semibold">查看全部</Link>
            </div>
            <div className="divide-y divide-slate-200">
              {recentPaymentsResult.data?.map((payment, index) => {
                const userRecord = Array.isArray(payment.store_users) ? payment.store_users[0] : payment.store_users
                const pkgRecord = Array.isArray(payment.traffic_packages) ? payment.traffic_packages[0] : payment.traffic_packages
                const status = normalizePaymentStatus(payment.status)
                return (
                  <div key={payment.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 px-6 py-3.5 text-sm">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${appIconClasses[index % appIconClasses.length]}`}>
                        {(pkgRecord?.name ?? 'O').slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">{pkgRecord?.name ?? '流量套餐'}</p>
                        <p className="truncate text-xs text-slate-500">{userRecord?.email ?? userRecord?.wallet_address ?? payment.tx_hash}</p>
                      </div>
                    </div>
                    <span className="whitespace-nowrap font-semibold text-slate-950">#{payment.chain_id}</span>
                    <span className={badgeClass(getPaymentStatusTone(status))}>{paymentStatusLabel(status)}</span>
                  </div>
                )
              })}
              {!recentPaymentsResult.data?.length ? <p className="px-6 py-8 text-sm text-slate-500">暂无订单记录。</p> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
