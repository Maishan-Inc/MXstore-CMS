import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  ChevronRight,
  CircleHelp,
  Download,
  Gauge,
  Grid2X2,
  Link2,
  Play,
  WalletCards,
  type LucideIcon
} from 'lucide-react'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatBytes } from '@/lib/format'
import { getPaymentStatusTone } from '@/lib/admin/labels'

type PaymentStatus = 'pending' | 'confirmed' | 'rejected'
type BadgeTone = 'success' | 'danger' | 'muted' | 'info'

const appIconClasses = [
  'bg-indigo-500 text-white',
  'bg-blue-500 text-white',
  'bg-teal-500 text-white',
  'bg-slate-900 text-white'
]

function badgeClass(tone: BadgeTone) {
  if (tone === 'success') return 'rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700'
  if (tone === 'danger') return 'rounded-md bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700'
  if (tone === 'info') return 'rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700'
  return 'rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600'
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
  return '处理中'
}

function formatOrderTotal(rawValues: Array<string | number | null>) {
  const total = rawValues.reduce<number>((sum, value) => sum + Number(value ?? 0), 0)
  return `¥ ${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(total)}`
}

function AppIcon({ label, index, kind }: { label: string; index: number; kind?: 'play' | 'link' }) {
  const Icon = kind === 'link' ? Link2 : Play
  return (
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${appIconClasses[index % appIconClasses.length]}`}>
      <Icon className="h-6 w-6" fill={kind === 'play' ? 'currentColor' : 'none'} />
      <span className="sr-only">{label}</span>
    </div>
  )
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
    <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-7">
        <div className={`flex h-20 w-20 items-center justify-center rounded-full ${iconClass}`}>
          <Icon className="h-10 w-10" strokeWidth={2.1} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-base font-medium text-slate-500">{label}</p>
            <CircleHelp className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')

  const supabase = createAdminClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    balanceResult,
    entitlementCountResult,
    todayDownloadsResult,
    recentDownloadsResult,
    recentPaymentsResult
  ] = await Promise.all([
    supabase.from('user_traffic_balances').select('balance_bytes').eq('user_id', user.id).maybeSingle(),
    supabase.from('app_entitlements').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('download_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', todayStart.toISOString()),
    supabase
      .from('download_sessions')
      .select('id,created_at,status,bytes_charged,apps(name,version),app_links(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4),
    supabase
      .from('payments')
      .select('id,status,amount_raw,created_at,traffic_packages(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4)
  ])

  const payments = recentPaymentsResult.data ?? []

  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-2 2xl:grid-cols-4">
        <MetricCard
          label="剩余流量"
          value={formatBytes(Number(balanceResult.data?.balance_bytes ?? 0)).replace(' ', '')}
          Icon={Gauge}
          iconClass="bg-blue-50 text-blue-600"
        />
        <MetricCard
          label="已购应用"
          value={String(entitlementCountResult.count ?? 0)}
          Icon={Grid2X2}
          iconClass="bg-violet-50 text-violet-600"
        />
        <MetricCard
          label="今日下载"
          value={String(todayDownloadsResult.count ?? 0)}
          Icon={Download}
          iconClass="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          label="订单总额"
          value={formatOrderTotal(payments.map((payment) => payment.amount_raw))}
          Icon={WalletCards}
          iconClass="bg-orange-50 text-orange-600"
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between px-7 py-7">
            <h2 className="text-xl font-semibold text-slate-950">最近下载</h2>
            <Link href="/dashboard/downloads" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950">
              查看全部
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto px-7 pb-5">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-4 font-medium">应用名称</th>
                  <th className="py-4 font-medium">版本</th>
                  <th className="py-4 font-medium">下载来源</th>
                  <th className="py-4 font-medium">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {recentDownloadsResult.data?.map((item, index) => {
                  const appRecord = Array.isArray(item.apps) ? item.apps[0] : item.apps
                  const linkRecord = Array.isArray(item.app_links) ? item.app_links[0] : item.app_links
                  const name = appRecord?.name ?? '未知应用'
                  return (
                    <tr key={item.id}>
                      <td className="whitespace-nowrap py-5 pr-5">
                        <div className="flex items-center gap-4">
                          <AppIcon label={name} index={index} kind={index === 0 ? 'play' : 'link'} />
                          <span className="font-medium text-slate-950">{name}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap py-5 pr-5">{appRecord?.version ?? '-'}</td>
                      <td className="whitespace-nowrap py-5 pr-5">{linkRecord?.name ?? 'MXStore'}</td>
                      <td className="whitespace-nowrap py-5">{formatDateTime(item.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!recentDownloadsResult.data?.length ? <p className="py-8 text-sm text-slate-500">暂无下载记录。</p> : null}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between px-7 py-7">
            <h2 className="text-xl font-semibold text-slate-950">最近订单</h2>
            <Link href="/dashboard/orders" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-950">
              查看全部
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-x-auto px-7 pb-5">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-4 font-medium">应用名称</th>
                  <th className="py-4 font-medium">订单金额</th>
                  <th className="py-4 font-medium">订单状态</th>
                  <th className="py-4 font-medium">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {payments.map((payment, index) => {
                  const pkgRecord = Array.isArray(payment.traffic_packages) ? payment.traffic_packages[0] : payment.traffic_packages
                  const status = normalizePaymentStatus(payment.status)
                  const name = pkgRecord?.name ?? '流量套餐'
                  return (
                    <tr key={payment.id}>
                      <td className="whitespace-nowrap py-5 pr-5">
                        <div className="flex items-center gap-4">
                          <AppIcon label={name} index={index} kind={index === 0 ? 'play' : 'link'} />
                          <span className="font-medium text-slate-950">{name}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap py-5 pr-5">¥ {payment.amount_raw}</td>
                      <td className="whitespace-nowrap py-5 pr-5">
                        <span className={badgeClass(getPaymentStatusTone(status))}>{paymentStatusLabel(status)}</span>
                      </td>
                      <td className="whitespace-nowrap py-5">{formatDateTime(payment.created_at)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!payments.length ? <p className="py-8 text-sm text-slate-500">暂无订单记录。</p> : null}
          </div>
        </div>
      </section>
    </div>
  )
}
