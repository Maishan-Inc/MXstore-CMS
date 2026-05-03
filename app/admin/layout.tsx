import Link from 'next/link'
import { getCurrentStoreUser } from '@/lib/auth'
import { AdminSidebarWrapper } from '@/components/admin-sidebar-wrapper'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentStoreUser()

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 lg:px-6">
        <AdminSidebarWrapper />
        <div className="min-w-0 flex-1 space-y-6">
          <header className="rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-slate-500">白色极简 SaaS 管理后台</p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-900">MXStore 管理后台</h1>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span>{user?.email ?? user?.wallet_address ?? user?.id ?? '管理员'}</span>
                <Link href="/" className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50">返回前台</Link>
                <form action="/auth/logout" method="post">
                  <button className="rounded-xl border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50">退出</button>
                </form>
              </div>
            </div>
          </header>
          {children}
        </div>
      </div>
    </div>
  )
}
