import Link from 'next/link'
import { adminNavigationItems } from '@/lib/admin/navigation'

export function AdminSidebar({ pathname }: { pathname: string }) {
  return (
    <aside className="hidden w-64 shrink-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:block">
      <div className="mb-6 border-b border-slate-100 pb-4">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-slate-400">MXStore CMS</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">管理员后台</h2>
      </div>
      <nav className="space-y-1">
        {adminNavigationItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active
                ? 'flex items-center rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700'
                : 'flex items-center rounded-2xl px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
