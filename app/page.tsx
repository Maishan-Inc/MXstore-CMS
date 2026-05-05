import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Box,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Code2,
  Database,
  FileText,
  Info,
  Search,
  ShieldCheck,
  Sparkle,
  Star,
  UserRound,
  Wallet,
  Zap
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { signedImageSrc } from '@/lib/openlist-image'

export const dynamic = 'force-dynamic'

type StoreApp = {
  name: string
  slug: string
  description: string | null
  version: string | null
  is_paid: boolean
  price_cents: number | null
  currency: string | null
  logo_url: string | null
}

type StoreCategory = {
  name: string
  slug: string
  icon: string
}

type HomeBanner = {
  title: string
  subtitle: string | null
  image_url: string | null
  cta_label: string | null
  cta_href: string | null
}

type DisplayApp = Pick<StoreApp, 'name' | 'slug' | 'logo_url'> & {
  icon: LucideIcon
  tone: string
}

const categories: Array<{ label: string; icon: LucideIcon; active?: boolean; dividerBefore?: boolean }> = [
  { label: '开发工具', icon: Code2, active: true },
  { label: 'AI 应用', icon: Sparkle },
  { label: '钱包', icon: Wallet },
  { label: '安全', icon: ShieldCheck },
  { label: '效率', icon: Zap },
  { label: '存储', icon: Database },
  { label: '套餐', icon: Box, dividerBefore: true },
  { label: '帮助', icon: CircleHelp },
  { label: '文档', icon: FileText },
  { label: '关于', icon: Info }
]

const iconMap: Record<string, LucideIcon> = {
  Box,
  Code2,
  Database,
  FileText,
  Info,
  Search,
  ShieldCheck,
  Sparkles: Sparkle,
  Sparkle,
  Wallet,
  Zap
}

const fallbackApps: DisplayApp[] = [
  { name: 'OpenList', slug: 'openlist', logo_url: null, icon: Search, tone: 'from-blue-500 to-blue-700' },
  { name: 'Dev Console', slug: 'dev-console', logo_url: null, icon: Code2, tone: 'from-slate-950 to-slate-800' },
  { name: 'ChainPay', slug: 'chainpay', logo_url: null, icon: Wallet, tone: 'from-cyan-400 to-blue-600' },
  { name: 'MetaScan', slug: 'metascan', logo_url: null, icon: Search, tone: 'from-violet-500 to-blue-700' },
  { name: 'Wallet Hub', slug: 'wallet-hub', logo_url: null, icon: Wallet, tone: 'from-slate-900 to-slate-700' },
  { name: 'Sync Box', slug: 'sync-box', logo_url: null, icon: Box, tone: 'from-indigo-500 to-blue-700' },
  { name: 'Rabby Kit', slug: 'rabby-kit', logo_url: null, icon: Zap, tone: 'from-violet-400 to-blue-500' },
  { name: 'AI Studio', slug: 'ai-studio', logo_url: null, icon: Sparkle, tone: 'from-slate-950 to-black' }
]

function iconForIndex(index: number) {
  return fallbackApps[index % fallbackApps.length].icon
}

function toneForIndex(index: number) {
  return fallbackApps[index % fallbackApps.length].tone
}

function FeaturedAppCard({ app }: { app: DisplayApp }) {
  const Icon = app.icon

  return (
    <Link
      href={`/app/${app.slug}`}
      className="group flex h-[116px] min-w-0 flex-col items-center justify-center rounded-[18px] border border-slate-200 bg-white px-4 shadow-[0_10px_25px_rgb(15_23_42_/_0.04)] transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_16px_32px_rgb(37_99_235_/_0.12)]"
    >
      <div className={`flex h-16 w-16 items-center justify-center rounded-[18px] bg-gradient-to-br ${app.tone} shadow-[0_10px_22px_rgb(37_99_235_/_0.18)]`}>
        {app.logo_url ? (
          <img src={signedImageSrc(app.logo_url) ?? app.logo_url} alt="" className="h-full w-full rounded-[18px] object-cover" />
        ) : (
          <Icon className="h-9 w-9 text-white" strokeWidth={2.4} />
        )}
      </div>
      <span className="mt-3 max-w-full truncate text-center text-sm font-semibold text-slate-950">{app.name}</span>
    </Link>
  )
}

function HeroVisual() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] overflow-hidden md:block">
      <div className="absolute left-[2%] top-[52%] h-[2px] w-[88%] -rotate-[16deg] rounded-full bg-white/90 shadow-[0_0_35px_rgb(37_99_235_/_0.32)]" />
      <div className="absolute left-[5%] top-[58%] h-[2px] w-[92%] -rotate-[22deg] rounded-full bg-blue-200/50" />
      <div className="absolute left-[28%] top-[45%] h-28 w-[68%] -rotate-6 rounded-[50%] border border-blue-300/70" />

      <div className="absolute left-[37%] top-[31%] h-60 w-60 rotate-12 rounded-[42px] border border-white/80 bg-gradient-to-br from-white/55 via-blue-300/55 to-blue-700 shadow-[0_35px_70px_rgb(37_99_235_/_0.26)] backdrop-blur-xl">
        <div className="absolute inset-6 rounded-[30px] bg-blue-600/70 shadow-inner" />
        <div className="absolute inset-0 rounded-[42px] bg-[linear-gradient(135deg,rgb(255_255_255_/_0.70),transparent_35%,rgb(255_255_255_/_0.36)_68%,transparent)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="-rotate-12 text-[92px] font-black leading-none text-white drop-shadow-sm">M</span>
        </div>
      </div>

      <div className="absolute bottom-[4%] left-[34%] h-24 w-72 rounded-[50%] border border-blue-200 bg-white/45 shadow-[0_22px_55px_rgb(37_99_235_/_0.18)]" />

      <div className="absolute left-[29%] top-[28%] flex h-[74px] w-[74px] rotate-2 items-center justify-center rounded-[22px] bg-gradient-to-br from-violet-300 to-violet-700 shadow-[0_16px_30px_rgb(124_58_237_/_0.28)]">
        <Code2 className="h-11 w-11 text-white" />
      </div>
      <div className="absolute left-[12%] top-[60%] flex h-[74px] w-[74px] -rotate-12 items-center justify-center rounded-[22px] bg-gradient-to-br from-sky-300 to-blue-600 shadow-[0_16px_30px_rgb(37_99_235_/_0.22)]">
        <Zap className="h-10 w-10 fill-white text-white" />
      </div>
      <div className="absolute right-[17%] top-[37%] flex h-[76px] w-[76px] rotate-12 items-center justify-center rounded-[22px] bg-gradient-to-br from-blue-200 to-blue-600 shadow-[0_16px_30px_rgb(37_99_235_/_0.22)]">
        <ShieldCheck className="h-10 w-10 text-white" />
      </div>
      <div className="absolute right-[13%] top-[65%] flex h-[78px] w-[78px] rotate-12 items-center justify-center rounded-[22px] bg-gradient-to-br from-emerald-300 to-emerald-600 shadow-[0_16px_30px_rgb(4_120_87_/_0.22)]">
        <Database className="h-11 w-11 text-white" />
      </div>
      <div className="absolute right-[30%] top-[16%] flex h-[70px] w-[70px] rotate-[18deg] items-center justify-center rounded-[22px] bg-gradient-to-br from-blue-100 to-blue-300 shadow-[0_16px_30px_rgb(37_99_235_/_0.16)]">
        <Star className="h-9 w-9 fill-white text-white" />
      </div>
    </div>
  )
}

export default async function HomePage() {
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

  const [{ data: apps, error }, { data: dbCategories }, { data: banners }] = await Promise.all([
    supabase
      .from('apps')
      .select('name,slug,description,version,is_paid,price_cents,currency,logo_url')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('app_categories')
      .select('name,slug,icon')
      .eq('enabled', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('home_banners')
      .select('title,subtitle,image_url,cta_label,cta_href')
      .eq('enabled', true)
      .order('sort_order', { ascending: true })
      .limit(5)
  ])

  if (error) throw error

  const featuredApps: DisplayApp[] = apps?.length
    ? apps.map((app: StoreApp, index: number) => ({
      name: app.name,
      slug: app.slug,
      logo_url: app.logo_url,
      icon: iconForIndex(index),
      tone: toneForIndex(index)
    }))
    : fallbackApps
  const sidebarCategories: Array<{ label: string; icon: LucideIcon; active?: boolean; dividerBefore?: boolean }> = dbCategories?.length
    ? dbCategories.map((category: StoreCategory, index: number) => ({
        label: category.name,
        icon: iconMap[category.icon] ?? Box,
        active: index === 0
      }))
    : categories
  const primaryBanner = (banners?.[0] as HomeBanner | undefined) ?? {
    title: '发现优质应用',
    subtitle: '为你的 Web3 体验加速',
    image_url: null,
    cta_label: '探索精选应用',
    cta_href: '#featured-apps'
  }

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white px-5 py-6 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between md:block">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.png" alt="MXStore" width={42} height={42} className="rounded-xl" priority />
              <span className="text-2xl font-bold text-slate-950">MXStore</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-blue-100 px-4 text-sm font-semibold text-blue-600 md:hidden"
            >
              <UserRound className="h-4 w-4" />
              登录
            </Link>
          </div>

          <nav className="mt-8 flex gap-2 overflow-x-auto pb-2 md:mt-12 md:block md:space-y-2 md:overflow-visible md:pb-0">
            <p className="hidden px-3 pb-3 text-base font-semibold text-slate-500 md:block">分类</p>
            {sidebarCategories.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className={item.dividerBefore ? 'md:border-t md:border-slate-200 md:pt-6' : undefined}>
                  <Link
                    href={item.active ? '/' : '#'}
                    className={`flex h-12 shrink-0 items-center gap-4 rounded-lg px-4 text-base font-semibold transition md:h-14 ${
                      item.active
                        ? 'bg-slate-100 text-blue-600 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.86)]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                  >
                    <Icon className="h-6 w-6" strokeWidth={2} />
                    <span>{item.label}</span>
                  </Link>
                </div>
              )
            })}
          </nav>

          <Link
            href="/login"
            className="mt-12 hidden h-14 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white text-base font-semibold text-blue-600 shadow-[0_8px_22px_rgb(37_99_235_/_0.05)] transition hover:border-blue-200 hover:bg-blue-50 md:flex"
          >
            <UserRound className="h-5 w-5" />
            登录
          </Link>
        </aside>

        <section className="min-w-0 bg-[radial-gradient(circle_at_78%_0%,#eff6ff_0,#ffffff_34%,#ffffff_100%)] px-5 py-8 md:px-9 md:py-10">
          <div className="relative min-h-[380px] overflow-hidden rounded-[20px] border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-blue-100 shadow-[0_20px_60px_rgb(37_99_235_/_0.08)] md:min-h-[610px]">
            <button
              type="button"
              aria-label="上一张推荐"
              className="absolute left-5 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-950 shadow-[0_10px_25px_rgb(15_23_42_/_0.10)] md:flex"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="下一张推荐"
              className="absolute right-5 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-950 shadow-[0_10px_25px_rgb(15_23_42_/_0.10)] md:flex"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="relative z-10 flex min-h-[380px] max-w-3xl flex-col justify-center px-7 py-16 md:min-h-[610px] md:px-28">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-white/55 px-5 py-3 text-base font-semibold text-blue-600 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.74)]">
                <Sparkle className="h-5 w-5" />
                精选推荐
              </div>
              <h1 className="mt-7 text-5xl font-black leading-[1.08] text-slate-950 md:text-7xl">{primaryBanner.title}</h1>
              <p className="mt-6 text-2xl font-medium text-slate-500 md:text-3xl">{primaryBanner.subtitle ?? '为你的 Web3 体验加速'}</p>
              <Link
                href={primaryBanner.cta_href ?? '#featured-apps'}
                className="mt-9 inline-flex h-16 w-fit items-center justify-center rounded-xl bg-blue-600 px-12 text-xl font-bold text-white shadow-[0_18px_35px_rgb(37_99_235_/_0.26)] transition hover:bg-blue-700"
              >
                {primaryBanner.cta_label ?? '探索精选应用'}
              </Link>
            </div>

            {primaryBanner.image_url ? (
              <div className="absolute inset-y-0 right-0 hidden w-[54%] items-center justify-center p-12 md:flex">
                <img src={signedImageSrc(primaryBanner.image_url) ?? primaryBanner.image_url} alt="" className="max-h-[460px] rounded-[28px] object-cover shadow-[0_30px_70px_rgb(37_99_235_/_0.22)]" />
              </div>
            ) : (
              <HeroVisual />
            )}

            <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 gap-3">
              {(banners?.length ? banners : [0, 1, 2, 3, 4]).map((item, index) => (
                <span
                  key={typeof item === 'number' ? item : item.title}
                  className={`h-3 w-3 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-slate-300'}`}
                />
              ))}
            </div>
          </div>

          <div id="featured-apps" className="mt-9">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-slate-950">精选应用</h2>
              <Link href="/dashboard/apps" className="inline-flex items-center gap-2 text-base font-semibold text-blue-600 hover:text-blue-700">
                查看全部
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
              {featuredApps.map((app) => (
                <FeaturedAppCard key={app.slug} app={app} />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
