import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatBytes } from '@/lib/format'
import { UserRoleSelect } from '@/components/admin-user-role'
import { AdminUserQuotas } from '@/components/admin-user-quotas'
import { AdminUserIdentity } from '@/components/admin-user-identity'

export default async function AdminUsersPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()
  const [{ data: users, error: usersError }, { data: balances, error: balancesError }, { data: entitlements, error: entitlementsError }] = await Promise.all([
    supabase.from('store_users').select('id,email,wallet_address,role,account_type,enterprise_certification_status,team_plan_status,organization_name,developer_name,download_quota_bytes,distribution_quota_bytes,distribution_charge_threshold_bytes,created_at').order('created_at', { ascending: false }),
    supabase.from('user_traffic_balances').select('user_id,balance_bytes'),
    supabase.from('app_entitlements').select('user_id')
  ])

  if (usersError) throw usersError
  if (balancesError) throw balancesError
  if (entitlementsError) throw entitlementsError

  const balanceMap = new Map((balances ?? []).map((item) => [item.user_id, Number(item.balance_bytes ?? 0)]))
  const entitlementCountMap = new Map<string, number>()
  for (const entitlement of entitlements ?? []) {
    entitlementCountMap.set(entitlement.user_id, (entitlementCountMap.get(entitlement.user_id) ?? 0) + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">用户管理</h1>
        <p className="mt-2 text-sm text-slate-500">查看用户邮箱、钱包地址、角色、流量余额和已购应用数。</p>
      </div>

      <section className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">用户</th>
                <th className="px-5 py-3 font-medium">钱包地址</th>
                <th className="px-5 py-3 font-medium">角色 / 身份</th>
                <th className="px-5 py-3 font-medium">流量余额</th>
                <th className="px-5 py-3 font-medium">已购应用数</th>
                <th className="px-5 py-3 font-medium">独立配额</th>
                <th className="px-5 py-3 font-medium">创建时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
              {users?.map((record) => (
                <tr key={record.id}>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-slate-900">{record.email ?? '未绑定邮箱'}</p>
                      <p className="text-xs text-slate-500">{record.id}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">{record.wallet_address ?? '-'}</td>
                  <td className="px-5 py-4">
                    <div className="space-y-2">
                      <UserRoleSelect userId={record.id} currentRole={record.role} />
                      <AdminUserIdentity
                        userId={record.id}
                        accountType={record.account_type}
                        enterpriseStatus={record.enterprise_certification_status}
                        teamPlanStatus={record.team_plan_status}
                        organizationName={record.organization_name}
                        developerName={record.developer_name}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{formatBytes(balanceMap.get(record.id) ?? 0)}</td>
                  <td className="px-5 py-4 text-slate-500">{entitlementCountMap.get(record.id) ?? 0}</td>
                  <td className="min-w-[420px] px-5 py-4">
                    <AdminUserQuotas
                      userId={record.id}
                      downloadQuotaBytes={Number(record.download_quota_bytes ?? 0)}
                      distributionQuotaBytes={Number(record.distribution_quota_bytes ?? 0)}
                      distributionChargeThresholdBytes={Number(record.distribution_charge_threshold_bytes ?? 0)}
                    />
                  </td>
                  <td className="px-5 py-4 text-slate-500">{new Date(record.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!users?.length ? <p className="px-5 py-8 text-sm text-slate-500">暂无用户数据。</p> : null}
      </section>
    </div>
  )
}
