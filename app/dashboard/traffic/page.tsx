import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatBytes } from '@/lib/format'

export default async function TrafficPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')

  const supabase = createAdminClient()
  const [{ data: balance }, { data: ledger, error }] = await Promise.all([
    supabase.from('user_traffic_balances').select('balance_bytes').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_traffic_ledger')
      .select('id,delta_bytes,reason,created_at,payments(tx_hash),download_sessions(apps(name),app_links(name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200)
  ])

  if (error) throw error

  const reasonLabels: Record<string, string> = {
    purchase_traffic: '购买流量',
    download: '下载扣减',
    admin_adjust: '管理员调整'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">流量明细</h1>
        <p className="mt-2 text-sm text-slate-500">查看流量收支明细记录。</p>
      </div>

      <section className="card">
        <p className="text-sm text-slate-500">当前余额</p>
        <p className="mt-2 text-3xl font-semibold text-slate-900">{formatBytes(Number(balance?.balance_bytes ?? 0))}</p>
      </section>

      <section className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">时间</th>
                <th className="px-5 py-3 font-medium">类型</th>
                <th className="px-5 py-3 font-medium">变动</th>
                <th className="px-5 py-3 font-medium">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
              {ledger?.map((entry) => {
                const payment = Array.isArray(entry.payments) ? entry.payments[0] : entry.payments
                const session = Array.isArray(entry.download_sessions) ? entry.download_sessions[0] : entry.download_sessions
                const sessionApp = session ? (Array.isArray(session.apps) ? session.apps[0] : session.apps) : null
                const sessionLink = session ? (Array.isArray(session.app_links) ? session.app_links[0] : session.app_links) : null

                return (
                  <tr key={entry.id}>
                    <td className="px-5 py-4 text-slate-500">{new Date(entry.created_at).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={entry.delta_bytes > 0
                        ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700'
                        : 'rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700'
                      }>{reasonLabels[entry.reason] ?? entry.reason}</span>
                    </td>
                    <td className={`px-5 py-4 font-medium ${entry.delta_bytes > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {entry.delta_bytes > 0 ? '+' : ''}{formatBytes(Number(entry.delta_bytes))}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {sessionApp ? `${sessionApp.name} · ${sessionLink?.name ?? ''}` : ''}
                      {payment?.tx_hash ? `tx: ${payment.tx_hash.slice(0, 10)}...` : ''}
                      {entry.reason === 'admin_adjust' ? '管理员手动调整' : ''}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!ledger?.length ? <p className="px-5 py-8 text-sm text-slate-500">暂无流量记录。</p> : null}
      </section>
    </div>
  )
}
