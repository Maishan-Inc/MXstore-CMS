import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPaymentStatusTone } from '@/lib/admin/labels'
import { OrderActions } from '@/components/admin-order-actions'

function badgeClass(tone: 'success' | 'danger' | 'muted' | 'info') {
  if (tone === 'success') return 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700'
  if (tone === 'danger') return 'rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700'
  if (tone === 'info') return 'rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700'
  return 'rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600'
}

export default async function AdminOrdersPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()
  const { data: payments, error } = await supabase
    .from('payments')
    .select('id,tx_hash,status,amount_raw,chain_id,payer_address,confirmed_block,created_at,reject_reason,store_users(email,wallet_address),traffic_packages(name)')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">订单支付</h1>
        <p className="mt-2 text-sm text-slate-500">查看链上支付校验结果、交易 hash 和订单状态。</p>
      </div>

      <section className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">订单</th>
                <th className="px-5 py-3 font-medium">用户</th>
                <th className="px-5 py-3 font-medium">金额</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">tx hash</th>
                <th className="px-5 py-3 font-medium">创建时间</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
              {payments?.map((payment) => {
                const userRecord = Array.isArray(payment.store_users) ? payment.store_users[0] : payment.store_users
                const pkgRecord = Array.isArray(payment.traffic_packages) ? payment.traffic_packages[0] : payment.traffic_packages
                return (
                  <tr key={payment.id}>
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{pkgRecord?.name ?? '流量套餐'}</p>
                        <p className="text-xs text-slate-500">chain {payment.chain_id} · block {payment.confirmed_block ?? '-'}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{userRecord?.email ?? userRecord?.wallet_address ?? '未知用户'}</td>
                    <td className="px-5 py-4 text-slate-500">{payment.amount_raw}</td>
                    <td className="px-5 py-4">
                      <div className="space-y-2">
                        <span className={badgeClass(getPaymentStatusTone(payment.status))}>{payment.status}</span>
                        {payment.reject_reason ? <p className="text-xs text-rose-600">{payment.reject_reason}</p> : null}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500">{payment.tx_hash}</td>
                    <td className="px-5 py-4 text-slate-500">{new Date(payment.created_at).toLocaleString()}</td>
                    <td className="px-5 py-4"><OrderActions paymentId={payment.id} status={payment.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!payments?.length ? <p className="px-5 py-8 text-sm text-slate-500">暂无订单记录。</p> : null}
      </section>
    </div>
  )
}
