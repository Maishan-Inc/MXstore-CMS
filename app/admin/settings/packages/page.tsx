import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PackageForm } from '@/components/package-form'
import { formatBytes } from '@/lib/format'
import { normalizePackagePayload } from '@/lib/admin/packages'
import { getIdentityPlanSettings } from '@/lib/identity-plan-settings'
import { IdentityPlanSettingsForm } from '@/components/identity-plan-settings-form'

export default async function PackagesPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()
  const [{ data: packages }, identityPlanSettings] = await Promise.all([
    supabase.from('traffic_packages').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
    getIdentityPlanSettings()
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">套餐设置</h1>
        <p className="mt-2 text-sm text-slate-500">管理身份选择页的会员卡片，以及用户可购买的链上付款流量套餐。</p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">身份套餐卡片</h2>
          <p className="mt-1 text-sm text-slate-500">这些内容会显示在身份选择页下方，四种身份的标题、价格、权益和按钮文案都可修改。</p>
        </div>
        <IdentityPlanSettingsForm initialSettings={identityPlanSettings} />
      </section>

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
                <p className="text-sm text-slate-500">
                  {pkg.traffic_label || formatBytes(Number(pkg.bytes_amount))} · chain {pkg.chain_id} · {pkg.asset_type}
                </p>
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
