import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPaymentStatusTone } from '@/lib/admin/labels'

function badgeClass(tone: 'success' | 'danger' | 'muted' | 'info') {
  if (tone === 'success') return 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700'
  if (tone === 'danger') return 'rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700'
  if (tone === 'info') return 'rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700'
  return 'rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600'
}

export default async function DashboardOrdersPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')

  const supabase = createAdminClient()
  const { data: payments } = await supabase
    .from('payments')
    .select('id,tx_hash,status,amount_raw,chain_id,created_at,traffic_packages(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">我的订单</h1>
        <p className="mt-2 text-sm text-slate-500">查看链上支付记录和订单状态。</p>
      </div>

      <section className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">套餐</th>
                <th className="px-5 py-3 font-medium">金额</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">tx hash</th>
                <th className="px-5 py-3 font-medium">时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
              {payments?.map((payment) => {
                const pkgRecord = Array.isArray(payment.traffic_packages) ? payment.traffic_packages[0] : payment.traffic_packages
                return (
                  <tr key={payment.id}>
                    <td className="px-5 py-4 font-medium text-slate-900">{pkgRecord?.name ?? '流量套餐'}</td>
                    <td className="px-5 py-4 text-slate-500">{payment.amount_raw}</td>
                    <td className="px-5 py-4">
                      <span className={badgeClass(getPaymentStatusTone(payment.status))}>{payment.status}</span>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 break-all max-w-[200px]">{payment.tx_hash}</td>
                    <td className="px-5 py-4 text-slate-500">{new Date(payment.created_at).toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!payments?.length ? <p className="px-5 py-8 text-sm text-slate-500 text-center">暂无订单记录。</p> : null}
      </section>
    </div>
  )
}
