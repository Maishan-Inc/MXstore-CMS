import Link from 'next/link'
import {
  BarChart3,
  Box,
  Clock3,
  CreditCard,
  Globe2,
  Grid2X2,
  Image,
  Link2,
  Settings,
  Users,
  type LucideIcon
} from 'lucide-react'
import { adminNavigationItems } from '@/lib/admin/navigation'

const icons: Record<string, LucideIcon> = {
  'layout-dashboard': Grid2X2,
  package: Box,
  box: Box,
  image: Image,
  link: Link2,
  globe: Globe2,
  clock: Clock3,
  'credit-card': CreditCard,
  users: Users,
  'bar-chart': BarChart3,
  settings: Settings
}

function isActivePath(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  if (href === '/admin/settings') return pathname === '/admin/settings'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="shrink-0 border-slate-200 bg-white lg:min-h-screen lg:w-[284px] lg:border-r">
      <div className="flex h-full flex-col px-5 py-8">
        <Link href="/admin" className="mb-10 flex items-center gap-2 text-slate-950">
          <span className="text-2xl font-semibold tracking-tight">MXStore</span>
          <span className="text-lg font-semibold">管理后台</span>
        </Link>
        <nav className="grid gap-2">
          {adminNavigationItems.map((item) => {
            const active = isActivePath(pathname, item.href)
            const Icon = icons[item.icon] ?? Settings
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active
                  ? 'flex h-14 items-center gap-4 rounded-xl bg-blue-50 px-5 text-[15px] font-semibold text-blue-600 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.04)]'
                  : 'flex h-14 items-center gap-4 rounded-xl px-5 text-[15px] font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-950'}
              >
                <Icon className={active ? 'h-5 w-5 text-blue-600' : 'h-5 w-5 text-slate-500'} strokeWidth={2.1} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto hidden justify-center pt-8 lg:flex">
          <button
            type="button"
            aria-label="折叠侧边栏"
            className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <span className="text-2xl leading-none">‹</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
