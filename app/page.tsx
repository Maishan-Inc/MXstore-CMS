import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Box,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Code2,
  Database,
  Download,
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
import { StoreAppIconLink } from '@/components/store-app-icon-link'
import { MxLogoMark } from '@/components/mx-logo-mark'
import { getCategoryIcon } from '@/lib/category-icons'

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
  show_on_recommended?: boolean
  recommendation_heat?: number
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
  image_openlist_domain?: string | null
  cta_label: string | null
  cta_href: string | null
}

type DisplayApp = Pick<StoreApp, 'name' | 'slug' | 'logo_url'> & {
  icon: LucideIcon
  tone: string
}

const categories: Array<{ label: string; icon: LucideIcon; active?: boolean; dividerBefore?: boolean }> = [
  { label: '推荐', icon: Star, active: true },
  { label: '开发工具', icon: Code2 },
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

const fallbackApps: DisplayApp[] = [
  { name: 'OpenList', slug: 'openlist', logo_url: null, icon: Search, tone: 'from-blue-500 to-slate-900' },
  { name: 'Dev Console', slug: 'dev-console', logo_url: null, icon: Code2, tone: 'from-slate-950 to-slate-800' },
  { name: 'ChainPay', slug: 'chainpay', logo_url: null, icon: Wallet, tone: 'from-orange-500 to-slate-900' },
  { name: 'MetaScan', slug: 'metascan', logo_url: null, icon: Search, tone: 'from-teal-500 to-slate-900' },
  { name: 'Wallet Hub', slug: 'wallet-hub', logo_url: null, icon: Wallet, tone: 'from-slate-900 to-slate-700' },
  { name: 'Sync Box', slug: 'sync-box', logo_url: null, icon: Box, tone: 'from-blue-400 to-slate-900' },
  { name: 'Rabby Kit', slug: 'rabby-kit', logo_url: null, icon: Zap, tone: 'from-orange-500 to-slate-900' },
  { name: 'AI Studio', slug: 'ai-studio', logo_url: null, icon: Sparkle, tone: 'from-slate-950 to-black' }
]

function iconForIndex(index: number) {
  return fallbackApps[index % fallbackApps.length].icon
}

function toneForIndex(index: number) {
  return fallbackApps[index % fallbackApps.length].tone
}

function HeroVisual() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[50%] items-center justify-center overflow-hidden p-8 2xl:p-12 lg:flex">
      <div className="relative h-[520px] w-full max-w-[620px] rounded-[40px] bg-[#0e0f0c] p-7 text-white wise-ring">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#9fe870]">MXStore Console</p>
            <p className="mt-2 text-3xl font-semibold">分发概览</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#9fe870] text-[#163300]">
            <Star className="h-7 w-7 fill-current" />
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4">
          {[
            { label: '签名下载', value: '98.7%', Icon: ShieldCheck },
            { label: '今日分发', value: '12.4K', Icon: Zap },
            { label: 'OpenList', value: '6 个域名', Icon: Database },
            { label: '钱包支付', value: '8453', Icon: Wallet }
          ].map((item) => (
            <div key={item.label} className="rounded-[30px] border border-white/10 bg-white/[0.06] p-5">
              <item.Icon className="h-7 w-7 text-[#9fe870]" />
              <p className="mt-5 text-sm font-semibold text-white/60">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="absolute -bottom-10 left-10 right-10 rounded-[32px] border border-[#9fe870]/60 bg-[#e2f6d5] p-5 text-[#163300] wise-ring">
          <p className="text-sm font-semibold">下一次安全下载</p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold">OpenList signed link</p>
              <p className="mt-1 text-sm font-semibold text-[#454745]">HMAC-SHA256 · 临时授权</p>
            </div>
            <Download className="h-8 w-8 shrink-0" />
          </div>
        </div>
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
      .select('name,slug,description,version,is_paid,price_cents,currency,logo_url,show_on_recommended,recommendation_heat')
      .eq('published', true)
      .eq('show_on_recommended', true)
      .order('recommendation_heat', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(64),
    supabase
      .from('app_categories')
      .select('name,slug,icon')
      .eq('enabled', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('home_banners')
      .select('title,subtitle,image_url,image_openlist_domain,cta_label,cta_href')
      .eq('enabled', true)
      .eq('placement', 'recommended')
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
    : []
  const sidebarCategories: Array<{ label: string; slug?: string; icon: LucideIcon; active?: boolean; dividerBefore?: boolean }> = dbCategories?.length
    ? [
        { label: '推荐', icon: Star, active: true },
        ...dbCategories.map((category: StoreCategory) => ({
        label: category.name,
        slug: category.slug,
        icon: getCategoryIcon(category.icon),
        active: false
      }))
      ]
    : categories
  const primaryBanner = (banners?.[0] as HomeBanner | undefined) ?? {
    title: '推荐应用',
    subtitle: '按推荐热度发现优质应用',
    image_url: null,
    cta_label: '探索精选应用',
    cta_href: '#featured-apps'
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#f7f8f2] text-[#0e0f0c]">
      <div className="grid min-h-screen w-full grid-cols-1 md:grid-cols-[clamp(240px,17vw,320px)_minmax(0,1fr)]">
        <aside className="left-0 flex flex-col border-b border-[#0e0f0c]/10 bg-white px-5 py-6 md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
          <div className="flex items-center justify-between md:block">
            <Link href="/" className="flex items-center gap-3">
              <MxLogoMark className="h-[50px] w-[50px]" />
              <span className="text-2xl font-black text-[#0e0f0c]">MXStore</span>
            </Link>
            <Link
              href="/login"
              className="wise-subtle-button inline-flex h-10 items-center gap-2 px-4 text-sm font-semibold md:hidden"
            >
              <UserRound className="h-4 w-4" />
              登录
            </Link>
          </div>

          <nav className="mt-8 flex gap-2 overflow-x-auto pb-2 md:mt-12 md:block md:flex-1 md:space-y-2 md:overflow-y-auto md:overflow-x-hidden md:pb-4 md:pr-1">
            <p className="hidden px-3 pb-3 text-base font-semibold text-[#868685] md:block">分类</p>
            {sidebarCategories.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className={item.dividerBefore ? 'md:border-t md:border-[#0e0f0c]/10 md:pt-6' : undefined}>
                  <Link
                    href={item.slug ? `/category/${item.slug}` : item.active ? '/' : '#'}
                    className={`flex h-12 shrink-0 items-center gap-4 rounded-lg px-4 text-base font-semibold transition md:h-14 ${
                      item.active
                        ? 'rounded-full bg-[#e2f6d5] text-[#163300]'
                        : 'text-[#454745] hover:rounded-full hover:bg-[rgba(211,242,192,0.4)] hover:text-[#0e0f0c]'
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
            className="wise-button mt-8 hidden h-14 items-center justify-center gap-2 text-base font-semibold md:flex"
          >
            <UserRound className="h-5 w-5" />
            登录
          </Link>
        </aside>

        <section className="flex min-h-screen min-w-0 flex-col bg-[#f7f8f2] px-4 py-6 sm:px-6 md:px-8 md:py-8 2xl:px-12">
          <div className="relative min-h-[420px] w-full overflow-hidden rounded-[40px] border border-[#0e0f0c]/10 bg-white wise-ring md:min-h-[610px] 2xl:min-h-[680px]">
            <button
              type="button"
              aria-label="上一张推荐"
              className="absolute left-5 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0e0f0c] wise-ring md:flex"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              aria-label="下一张推荐"
              className="absolute right-5 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0e0f0c] wise-ring md:flex"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            <div className="relative z-10 flex min-h-[420px] w-full flex-col justify-center px-7 py-16 md:min-h-[610px] md:w-[56%] md:px-16 xl:px-24 2xl:min-h-[680px] 2xl:px-32">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#e2f6d5] px-5 py-3 text-base font-semibold text-[#163300]">
                <Sparkle className="h-5 w-5" />
                精选推荐
              </div>
              <h1 className="wise-display mt-8 text-[56px] text-[#0e0f0c] md:text-[88px] 2xl:text-[108px]">{primaryBanner.title}</h1>
              <p className="mt-8 text-xl font-semibold leading-[1.44] text-[#454745] md:text-2xl">{primaryBanner.subtitle ?? '为你的 Web3 体验加速'}</p>
              <Link
                href={primaryBanner.cta_href ?? '#featured-apps'}
                className="wise-button mt-9 inline-flex h-16 w-fit items-center justify-center px-12 text-xl font-bold"
              >
                {primaryBanner.cta_label ?? '探索精选应用'}
              </Link>
            </div>

            {primaryBanner.image_url ? (
              <div className="absolute inset-y-0 right-0 hidden w-[50%] items-center justify-center p-8 md:flex 2xl:p-12">
                <img src={signedImageSrc(primaryBanner.image_url, primaryBanner.image_openlist_domain) ?? primaryBanner.image_url} alt="" className="h-full max-h-[520px] w-full max-w-[720px] rounded-[40px] object-cover wise-ring" />
              </div>
            ) : (
              <HeroVisual />
            )}

            <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 gap-3">
              {(banners?.length ? banners : [0, 1, 2, 3, 4]).map((item, index) => (
                <span
                  key={typeof item === 'number' ? item : item.title}
                  className={`h-3 w-3 rounded-full ${index === 0 ? 'bg-[#9fe870]' : 'bg-[#cdd2ca]'}`}
                />
              ))}
            </div>
          </div>

          <div id="featured-apps" className="mt-9">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-3xl font-black text-[#0e0f0c]">推荐应用</h2>
              <Link href="/apps" className="wise-subtle-button inline-flex items-center gap-2 px-5 py-3 text-base font-semibold">
                查看全部
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>

            {featuredApps.length ? (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8">
                {featuredApps.map((app) => (
                  <StoreAppIconLink key={app.slug} app={app} icon={app.icon} tone={app.tone} />
                ))}
              </div>
            ) : (
              <p className="rounded-[30px] border border-[#0e0f0c]/10 bg-white px-5 py-8 text-sm font-semibold text-[#868685] wise-ring">
                暂无推荐应用。请在管理员后台勾选“在推荐页面显示”，并填写推荐热度。
              </p>
            )}
          </div>

          <footer className="mt-auto border-t border-[#0e0f0c]/10 py-6 text-center text-sm font-semibold text-[#454745]">
            Copyright © 2026 Maishan Inc. All rights reserved MXStore
          </footer>
        </section>
      </div>
    </main>
  )
}
