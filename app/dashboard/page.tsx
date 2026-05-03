import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatBytes } from '@/lib/format'

export default async function DashboardPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')

  const supabase = createAdminClient()
  const { data: balance } = await supabase
    .from('user_traffic_balances')
    .select('balance_bytes')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: downloads } = await supabase
    .from('download_sessions')
    .select('created_at,status,bytes_charged,apps(name),app_links(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-500">剩余流量</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{formatBytes(Number(balance?.balance_bytes ?? 0))}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">登录方式</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">{user.wallet_address ? '钱包' : 'OAuth'}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">角色</p>
          <p className="mt-2 text-lg font-semibold capitalize text-slate-900">{user.role}</p>
        </div>
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">最近下载</h2>
        <div className="space-y-3">
          {downloads?.map((item, index) => {
            const appRecord = Array.isArray(item.apps) ? item.apps[0] : item.apps
            const linkRecord = Array.isArray(item.app_links) ? item.app_links[0] : item.app_links

            return (
              <div key={index} className="flex justify-between rounded-2xl border border-slate-200 p-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{appRecord?.name ?? '未知应用'} · {linkRecord?.name ?? '下载链接'}</p>
                  <p className="text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right text-slate-500">
                  <p>{item.status}</p>
                  <p>{formatBytes(Number(item.bytes_charged ?? 0))}</p>
                </div>
              </div>
            )
          })}
          {!downloads?.length ? <p className="text-sm text-slate-500">暂无下载记录</p> : null}
        </div>
      </section>
    </div>
  )
}
