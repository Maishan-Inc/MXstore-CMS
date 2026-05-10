import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAccountTypeLabel, getEnterpriseStatusLabel } from '@/lib/account'

export default async function AdminUsersPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()
  const { data: users, error } = await supabase
    .from('store_users')
    .select('id,email,wallet_address,role,account_type,enterprise_certification_status,kyc_status,created_at')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">用户管理</h1>
        <p className="mt-2 text-sm text-slate-500">点击用户进入详情页，修改资料、配额、身份认证和 KYC 审核。</p>
      </div>

      <section className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">用户</th>
                <th className="px-5 py-3 font-medium">角色</th>
                <th className="px-5 py-3 font-medium">身份</th>
                <th className="px-5 py-3 font-medium">KYC</th>
                <th className="px-5 py-3 font-medium">创建时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
              {users?.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <Link href={`/admin/users/${record.id}`} className="block">
                      <p className="font-medium text-slate-900">{record.email ?? record.wallet_address ?? '未绑定账户'}</p>
                      <p className="mt-1 text-xs text-slate-500">{record.id}</p>
                    </Link>
                  </td>
                  <td className="px-5 py-4">{record.role}</td>
                  <td className="px-5 py-4">
                    <p>{getAccountTypeLabel(record.account_type)}</p>
                    <p className="mt-1 text-xs text-slate-500">{getEnterpriseStatusLabel(record.enterprise_certification_status)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{kycLabel(record.kyc_status)}</span>
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

function kycLabel(status: string) {
  if (status === 'verified') return '已通过'
  if (status === 'pending') return '待审核'
  if (status === 'rejected') return '未通过'
  if (status === 'needs_more_info') return '补充材料'
  return '无需'
}
