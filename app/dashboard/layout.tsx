import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  ChevronDown,
  CreditCard,
  Download,
  ExternalLink,
  Grid2X2,
  Home,
  Package,
  UploadCloud,
  Settings,
  Wallet,
  type LucideIcon
} from 'lucide-react'
import { getCurrentStoreUser } from '@/lib/auth'
import { canPublishApps } from '@/lib/account'

const baseNavItems = [
  { href: '/dashboard', label: '概览', icon: Home },
  { href: '/dashboard/apps', label: '我的应用', icon: Grid2X2 },
  { href: '/dashboard/downloads', label: '下载记录', icon: Download },
  { href: '/dashboard/traffic', label: '流量余额', icon: Package },
  { href: '/dashboard/orders', label: '订单支付', icon: CreditCard },
  { href: '/dashboard/settings', label: '钱包设置', icon: Wallet }
] satisfies Array<{ href: string; label: string; icon: LucideIcon }>

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function compactAccount(user: Awaited<ReturnType<typeof getCurrentStoreUser>>) {
  const address = user?.wallet_address
  if (address && address.length > 12) return `${address.slice(0, 6)}...${address.slice(-4)}`
  return user?.email ?? address ?? '用户'
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentStoreUser()
  const headerList = await headers()
  const pathname = headerList.get('x-pathname') ?? '/dashboard'
  if (user?.account_type === 'unselected') redirect('/onboarding')
  const navItems = user && canPublishApps(user)
    ? [
        ...baseNavItems.slice(0, 2),
        { href: '/dashboard/publisher/apps', label: '发布应用', icon: UploadCloud },
        ...baseNavItems.slice(2)
      ]
    : baseNavItems

  return (
    <div className="min-h-screen bg-[#f7f8f2] text-[#0e0f0c]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="shrink-0 border-[#0e0f0c]/10 bg-white lg:min-h-screen lg:w-[300px] lg:border-r">
          <div className="flex h-full flex-col px-5 py-9">
            <Link href="/dashboard" className="mb-12 flex items-center gap-2 text-[#0e0f0c]">
              <span className="text-2xl font-black tracking-normal">MXStore</span>
              <span className="rounded-full bg-[#e2f6d5] px-3 py-1 text-sm font-semibold text-[#163300]">用户中心</span>
            </Link>
            <nav className="grid gap-3">
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={active
                      ? 'flex h-16 items-center gap-4 rounded-full bg-[#e2f6d5] px-7 text-[15px] font-semibold text-[#163300]'
                      : 'flex h-16 items-center gap-4 rounded-full px-7 text-[15px] font-semibold text-[#454745] hover:bg-[rgba(211,242,192,0.4)] hover:text-[#0e0f0c]'}
                  >
                    <Icon className={active ? 'h-5 w-5 text-[#163300]' : 'h-5 w-5 text-[#868685]'} strokeWidth={2} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
            <div className="mt-auto pt-10">
              <Link
                href="/"
                className="flex h-12 items-center justify-between rounded-full px-7 text-sm font-semibold text-[#454745] hover:bg-[rgba(211,242,192,0.4)] hover:text-[#0e0f0c]"
              >
                <span className="inline-flex items-center gap-3">
                  <Settings className="h-5 w-5" />
                  帮助中心
                </span>
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-[#0e0f0c]/10 bg-white/90 px-6 py-7 backdrop-blur lg:px-14">
            <div className="flex items-center justify-between gap-6">
              <h1 className="text-2xl font-black tracking-normal text-[#0e0f0c]">欢迎回来</h1>
              <div className="flex items-center gap-4">
                <div className="hidden h-14 items-center gap-3 rounded-full border border-[#0e0f0c]/10 bg-white px-5 text-sm font-semibold text-[#454745] wise-ring sm:flex">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e2f6d5] text-xs text-[#163300]">◆</span>
                  {compactAccount(user)}
                  <ChevronDown className="h-4 w-4 text-[#868685]" />
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#9fe870] text-base font-semibold text-[#163300] wise-ring">
                  {user?.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full rounded-full object-cover" /> : compactAccount(user).slice(0, 1).toUpperCase()}
                </div>
                <ChevronDown className="h-4 w-4 text-[#868685]" />
              </div>
            </div>
          </header>
          <main className="px-6 pb-10 pt-6 lg:px-14">{children}</main>
          <footer className="border-t border-[#0e0f0c]/10 bg-white px-6 py-8 text-sm font-semibold text-[#868685] lg:px-14">
            <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-5 sm:flex-row">
              <span>© 2024 MXStore，保留所有权利。</span>
              <Link href="/" className="text-slate-500 hover:text-slate-900">服务条款</Link>
              <Link href="/" className="text-slate-500 hover:text-slate-900">隐私政策</Link>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
