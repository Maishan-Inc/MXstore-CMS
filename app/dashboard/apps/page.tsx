import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatMoney } from '@/lib/format'
import { signedImageSrc } from '@/lib/openlist-image'

export default async function DashboardAppsPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')

  const supabase = createAdminClient()
  const { data: entitlements } = await supabase
    .from('app_entitlements')
    .select('id,expires_at,created_at,apps(id,name,slug,version,logo_url,is_paid,price_cents,currency)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">已购应用</h1>
        <p className="mt-2 text-sm text-slate-500">查看已购买或获得授权的应用。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {entitlements?.map((item) => {
          const appRecord = Array.isArray(item.apps) ? item.apps[0] : item.apps
          if (!appRecord) return null
          return (
            <Link key={item.id} href={`/app/${appRecord.slug}`} className="card hover:border-blue-200">
              <div className="flex gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl font-semibold text-slate-700">
                  {appRecord.logo_url ? <img src={signedImageSrc(appRecord.logo_url) ?? appRecord.logo_url} alt="" className="h-full w-full rounded-2xl object-cover" /> : appRecord.name.slice(0, 1)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{appRecord.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{appRecord.version ?? '未知版本'}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {appRecord.is_paid ? formatMoney(appRecord.price_cents, appRecord.currency ?? 'USD') : '免费'}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {!entitlements?.length ? (
        <div className="card text-center">
          <p className="text-sm text-slate-500">还没有已购应用。</p>
          <Link href="/" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700">浏览应用商店</Link>
        </div>
      ) : null}
    </div>
  )
}
