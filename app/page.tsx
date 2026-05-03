import { redirect } from 'next/navigation'
import { AppCard } from '@/components/app-card'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // If Supabase env vars are missing, redirect to install
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    redirect('/install')
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  let installed = false
  try {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'installed')
      .maybeSingle()
    installed = data?.value === 'true'
  } catch {
    installed = false
  }

  // Not installed yet - redirect to install wizard
  if (!installed) {
    redirect('/install')
  }

  const { data: apps, error } = await supabase
    .from('apps')
    .select('name,slug,description,version,is_paid,price_cents,currency,logo_url')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-600">MXStore CMS</p>
        <h1 className="mt-4 text-4xl font-semibold text-slate-900">应用商店与签名下载系统</h1>
        <p className="mt-4 max-w-2xl text-slate-600">
          支持 OpenList 域名 Token 自动匹配、短时签名下载、外部官网链接、钱包登录、第三方登录、流量套餐和链上付款验证。
        </p>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-900">已上架应用</h2>
        {apps?.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => <AppCard key={app.slug} app={app} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            暂无已上架应用，请在管理后台添加。
          </div>
        )}
      </section>
    </div>
  )
}
