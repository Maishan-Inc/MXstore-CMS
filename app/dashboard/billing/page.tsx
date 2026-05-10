import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { TrafficPackageCard } from '@/components/traffic-package-card'

export default async function BillingPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')

  const supabase = createAdminClient()
  const { data: packages } = await supabase
    .from('traffic_packages')
    .select('*')
    .eq('enabled', true)
    .order('sort_order', { ascending: true })
    .order('bytes_amount')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">充值流量套餐</h1>
        <p className="mt-2 text-sm text-slate-500">MVP 脚手架已提供链上交易校验 API。前端支付按钮可接入 wagmi 的 sendTransaction/writeContract。</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {packages?.map((pkg) => <TrafficPackageCard key={pkg.id} pkg={pkg} />)}
      </div>
    </div>
  )
}
