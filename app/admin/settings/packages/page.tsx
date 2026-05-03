import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PackageForm } from '@/components/package-form'
import { formatBytes } from '@/lib/format'
import { normalizePackagePayload } from '@/lib/admin/packages'

export default async function PackagesPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()
  const { data: packages } = await supabase.from('traffic_packages').select('*').order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">流量套餐</h1>
        <p className="mt-2 text-sm text-slate-500">管理用户可购买的链上付款套餐，支持 native 和 ERC20 校验配置。</p>
      </div>
      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">新增套餐</h2>
        <PackageForm />
      </section>
      <section className="space-y-4">
        {packages?.map((pkg) => (
          <div key={pkg.id} className="card space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{pkg.name}</h2>
                <p className="text-sm text-slate-500">{formatBytes(Number(pkg.bytes_amount))} · chain {pkg.chain_id} · {pkg.asset_type}</p>
              </div>
              <span className={pkg.enabled ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700' : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600'}>
                {pkg.enabled ? '启用中' : '已停用'}
              </span>
            </div>
            <PackageForm mode="edit" packageId={pkg.id} initialValues={normalizePackagePayload(pkg)} />
          </div>
        ))}
        {!packages?.length ? <div className="card text-sm text-slate-500">还没有配置流量套餐。</div> : null}
      </section>
    </div>
  )
}
