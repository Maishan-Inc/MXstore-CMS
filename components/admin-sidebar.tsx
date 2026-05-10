import Image from 'next/image'
import Link from 'next/link'
import {
  BarChart3,
  Box,
  Clock3,
  CreditCard,
  Globe2,
  Grid2X2,
  Image as ImageIcon,
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
  image: ImageIcon,
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
    <aside className="shrink-0 border-[#0e0f0c]/10 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-[284px] lg:self-start lg:border-r">
      <div className="flex h-full flex-col overflow-y-auto px-5 py-8">
        <Link href="/admin" className="mb-10 flex items-center gap-3 text-[#0e0f0c]">
          <Image src="/logo.png" alt="MXStore" width={42} height={42} className="rounded-xl" priority />
          <span className="text-2xl font-black tracking-normal">MXStore</span>
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
                  ? 'flex h-14 items-center gap-4 rounded-full bg-[#e2f6d5] px-5 text-[15px] font-semibold text-[#163300]'
                  : 'flex h-14 items-center gap-4 rounded-full px-5 text-[15px] font-semibold text-[#454745] hover:bg-[rgba(211,242,192,0.4)] hover:text-[#0e0f0c]'}
              >
                <Icon className={active ? 'h-5 w-5 text-[#163300]' : 'h-5 w-5 text-[#868685]'} strokeWidth={2.1} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto hidden justify-center pt-8 lg:flex">
          <button
            type="button"
            aria-label="折叠侧边栏"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#868685] hover:bg-[rgba(211,242,192,0.4)] hover:text-[#0e0f0c]"
          >
            <span className="text-2xl leading-none">‹</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
