import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { AccountAvatarForm } from '@/components/account-avatar-form'

export default async function DashboardSettingsPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">账户设置</h1>
        <p className="mt-2 text-sm text-slate-500">查看账户信息和登录方式。</p>
      </div>

      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">基本信息</h2>
        <AccountAvatarForm avatarUrl={user.avatar_url} fallbackLabel={user.email ?? user.wallet_address ?? '用户'} />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">用户 ID</p>
            <p className="mt-1 text-sm text-slate-900">{user.id}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">邮箱</p>
            <p className="mt-1 text-sm text-slate-900">{user.email ?? '未绑定'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">钱包地址</p>
            <p className="mt-1 text-sm text-slate-900 break-all">{user.wallet_address ?? '未绑定'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">角色</p>
            <p className="mt-1 text-sm text-slate-900 capitalize">{user.role}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">头像来源</p>
            <p className="mt-1 text-sm text-slate-900">{user.avatar_source === 'custom' ? '自定义上传' : user.avatar_source === 'oauth' ? '社交媒体账户' : '未设置'}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
