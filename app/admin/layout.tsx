import Link from 'next/link'
import { ChevronDown, Circle, Search } from 'lucide-react'
import { getCurrentStoreUser } from '@/lib/auth'
import { AdminSidebarWrapper } from '@/components/admin-sidebar-wrapper'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentStoreUser()
  const accountName = user?.email ?? user?.wallet_address ?? user?.id ?? '管理员'

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminSidebarWrapper />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-5 backdrop-blur lg:px-11">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <label className="flex h-14 w-full max-w-[584px] items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                <Search className="h-5 w-5" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  placeholder="搜索应用、订单、用户..."
                />
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-800">
                  <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                  Supabase Cloud 已连接
                </span>
                <span className="inline-flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 text-sm font-medium text-slate-800">
                  <Circle className="h-3 w-3 fill-blue-500 text-blue-500" />
                  Vercel 已部署
                </span>
                <span className="hidden h-9 w-px bg-slate-200 md:block" />
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                    {user?.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full rounded-full object-cover" /> : '管'}
                  </div>
                  <div className="min-w-0">
                    <p className="max-w-40 truncate text-sm font-semibold text-slate-900">{accountName}</p>
                    <Link href="/" className="text-xs font-medium text-slate-500 hover:text-slate-900">返回前台</Link>
                  </div>
                  <ChevronDown className="h-4 w-4 text-slate-600" />
                </div>
                <form action="/auth/logout" method="post">
                  <button className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    退出
                  </button>
                </form>
              </div>
            </div>
          </header>
          <main className="px-5 py-8 lg:px-11">{children}</main>
        </div>
      </div>
    </div>
  )
}
