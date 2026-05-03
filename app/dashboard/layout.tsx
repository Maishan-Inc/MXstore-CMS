import Link from 'next/link'
import { getCurrentStoreUser } from '@/lib/auth'

const navItems = [
  { href: '/dashboard', label: '概览' },
  { href: '/dashboard/apps', label: '已购应用' },
  { href: '/dashboard/downloads', label: '下载记录' },
  { href: '/dashboard/traffic', label: '流量明细' },
  { href: '/dashboard/orders', label: '我的订单' },
  { href: '/dashboard/billing', label: '充值流量' },
  { href: '/dashboard/settings', label: '账户设置' }
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentStoreUser()

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">用户后台</p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">{user?.email ?? user?.wallet_address ?? '用户'}</h1>
          </div>
          <nav className="flex gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}
