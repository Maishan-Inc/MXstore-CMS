import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStoreUser } from '@/lib/auth'
import { DownloadButton } from '@/components/download-button'
import { AppPurchaseButton } from '@/components/app-purchase-button'
import { formatBytes, formatMoney } from '@/lib/format'

export default async function AppDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data: app, error } = await supabase
    .from('apps')
    .select('id,name,slug,description,version,is_paid,price_cents,currency,logo_url,published,app_links(id,name,input_url,file_size_bytes,charge_traffic,sort_order)')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  if (!app || !app.published) notFound()

  const links = [...(app.app_links ?? [])].sort((a, b) => a.sort_order - b.sort_order)

  const currentUser = await getCurrentStoreUser()
  let hasEntitlement = false
  if (currentUser && app.is_paid) {
    const { data: ent } = await supabase
      .from('app_entitlements')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('app_id', app.id)
      .maybeSingle()
    hasEntitlement = !!ent
  }

  const canDownload = !app.is_paid || hasEntitlement

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="card">
        <div className="flex gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-slate-100 text-3xl font-bold text-slate-700">
            {app.logo_url ? <img src={app.logo_url} alt="" className="h-full w-full rounded-3xl object-cover" /> : app.name.slice(0, 1)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{app.name}</h1>
            <p className="mt-2 text-sm text-slate-500">版本：{app.version ?? '未知'} · {app.is_paid ? formatMoney(app.price_cents, app.currency ?? 'USD') : '免费'}</p>
          </div>
        </div>
        <div className="mt-8 max-w-none whitespace-pre-wrap text-slate-600">{app.description ?? '暂无介绍'}</div>
      </section>

      <aside className="card h-fit space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">{canDownload ? '下载' : '购买'}</h2>
        {app.is_paid && !hasEntitlement && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="mb-3 text-sm text-amber-800">该应用为付费应用，购买后即可下载。</p>
            <AppPurchaseButton
              appId={app.id}
              payToAddress="0x0000000000000000000000000000000000000000"
              amountRaw={String(app.price_cents)}
              chainId={8453}
            />
          </div>
        )}
        {canDownload && links.length === 0 && <p className="text-sm text-slate-500">暂无下载链接</p>}
        {canDownload && links.map((link) => (
          <div key={link.id} className="rounded-xl border border-slate-200 p-4">
            <div className="mb-3">
              <p className="font-medium text-slate-900">{link.name}</p>
              <p className="text-xs text-slate-500">{formatBytes(link.file_size_bytes)}{link.charge_traffic ? ' · 扣流量' : ' · 不扣流量'}</p>
            </div>
            <DownloadButton linkId={link.id} label="立即下载" />
          </div>
        ))}
      </aside>
    </div>
  )
}
