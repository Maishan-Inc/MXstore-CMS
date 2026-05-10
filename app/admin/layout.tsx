import Link from 'next/link'
import { ChevronDown, Circle, Search } from 'lucide-react'
import { getCurrentStoreUser } from '@/lib/auth'
import { AdminSidebarWrapper } from '@/components/admin-sidebar-wrapper'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentStoreUser()
  const accountName = user?.email ?? user?.wallet_address ?? user?.id ?? '管理员'

  return (
    <div className="min-h-screen bg-[#f7f8f2] text-[#0e0f0c]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AdminSidebarWrapper />
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-[#0e0f0c]/10 bg-white/95 px-5 py-5 backdrop-blur lg:px-11">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <label className="flex h-14 w-full max-w-[584px] items-center gap-3 rounded-full border border-[#0e0f0c]/10 bg-white px-5 text-[#868685] wise-ring">
                <Search className="h-5 w-5" />
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#0e0f0c] outline-none placeholder:text-[#868685]"
                  placeholder="搜索应用、订单、用户..."
                />
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex h-12 items-center gap-3 rounded-full border border-[#0e0f0c]/10 bg-white px-5 text-sm font-semibold text-[#454745]">
                  <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                  Supabase Cloud 已连接
                </span>
                <span className="inline-flex h-12 items-center gap-3 rounded-full border border-[#0e0f0c]/10 bg-white px-5 text-sm font-semibold text-[#454745]">
                  <Circle className="h-3 w-3 fill-[#9fe870] text-[#9fe870]" />
                  Vercel 已部署
                </span>
                <span className="hidden h-9 w-px bg-[#0e0f0c]/10 md:block" />
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e2f6d5] text-sm font-semibold text-[#163300]">
                    {user?.avatar_url ? <img src={user.avatar_url} alt="" className="h-full w-full rounded-full object-cover" /> : '管'}
                  </div>
                  <div className="min-w-0">
                    <p className="max-w-40 truncate text-sm font-semibold text-[#0e0f0c]">{accountName}</p>
                    <Link href="/" className="text-xs font-semibold text-[#868685] hover:text-[#0e0f0c]">返回前台</Link>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#868685]" />
                </div>
                <form action="/auth/logout" method="post">
                  <button className="wise-subtle-button h-10 px-4 text-sm font-semibold">
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
