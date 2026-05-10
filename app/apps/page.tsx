import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Box, Code2, Database, Search, ShieldCheck, Sparkle, UserRound, Wallet, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { StoreAppIconLink } from '@/components/store-app-icon-link'

export const dynamic = 'force-dynamic'

type StoreApp = {
  name: string
  slug: string
  logo_url: string | null
}

type DisplayApp = StoreApp & {
  icon: LucideIcon
  tone: string
}

const appVisuals: Array<{ icon: LucideIcon; tone: string }> = [
  { icon: Search, tone: 'from-blue-500 to-blue-700' },
  { icon: Code2, tone: 'from-slate-950 to-slate-800' },
  { icon: Wallet, tone: 'from-cyan-400 to-blue-600' },
  { icon: ShieldCheck, tone: 'from-emerald-400 to-emerald-600' },
  { icon: Database, tone: 'from-indigo-500 to-blue-700' },
  { icon: Zap, tone: 'from-violet-400 to-blue-500' },
  { icon: Sparkle, tone: 'from-slate-950 to-black' },
  { icon: Box, tone: 'from-blue-400 to-sky-600' }
]

function iconForIndex(index: number) {
  return appVisuals[index % appVisuals.length].icon
}

function toneForIndex(index: number) {
  return appVisuals[index % appVisuals.length].tone
}

export default async function AppsPage() {
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

  if (!installed) {
    redirect('/install')
  }

  const { data: apps, error } = await supabase
    .from('apps')
    .select('name,slug,logo_url')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(96)

  if (error) throw error

  const displayApps: DisplayApp[] = apps?.map((app: StoreApp, index: number) => ({
    ...app,
    icon: iconForIndex(index),
    tone: toneForIndex(index)
  })) ?? []

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="MXStore" width={42} height={42} className="rounded-xl" priority />
            <span className="text-2xl font-bold text-slate-950">MXStore</span>
          </Link>
          <Link href="/login" className="inline-flex h-10 items-center gap-2 rounded-full border border-blue-100 px-4 text-sm font-semibold text-blue-600">
            <UserRound className="h-4 w-4" />
            登录
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-9">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">全部应用</h1>
            <p className="mt-2 text-sm text-slate-500">浏览已发布的 MXStore 应用。</p>
          </div>
          <Link href="/" className="text-sm font-semibold text-blue-600 hover:text-blue-700">返回首页</Link>
        </div>

        {displayApps.length ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
            {displayApps.map((app) => (
              <StoreAppIconLink key={app.slug} app={app} icon={app.icon} tone={app.tone} />
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-8 text-sm text-slate-500">暂无已发布应用。</p>
        )}
      </section>
    </main>
  )
}
