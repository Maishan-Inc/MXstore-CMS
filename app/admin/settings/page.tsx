import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { DatabaseUpdateButton } from '@/components/database-update-button'

export default async function AdminSettingsPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">系统设置</h1>
        <p className="mt-2 text-sm text-slate-500">管理域名 Token 配置、流量套餐和系统参数。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/admin/settings/domains" className="card hover:border-blue-200">
          <h2 className="text-lg font-semibold text-slate-900">域名与 Token</h2>
          <p className="mt-2 text-sm text-slate-500">配置 OpenList 域名映射、管理员 Token 加密存储、签名有效期和启停状态。</p>
        </Link>

        <Link href="/admin/settings/packages" className="card hover:border-blue-200">
          <h2 className="text-lg font-semibold text-slate-900">流量套餐</h2>
          <p className="mt-2 text-sm text-slate-500">管理用户可购买的链上付款流量套餐，支持 native 和 ERC20 校验配置。</p>
        </Link>

        <Link href="/admin/settings/login-providers" className="card hover:border-blue-200">
          <h2 className="text-lg font-semibold text-slate-900">第三方登录</h2>
          <p className="mt-2 text-sm text-slate-500">配置快捷登录、OAuth、钱包连接器和登录按钮图标。</p>
        </Link>

        <Link href="/admin/settings/footer" className="card hover:border-blue-200">
          <h2 className="text-lg font-semibold text-slate-900">底部栏设置</h2>
          <p className="mt-2 text-sm text-slate-500">配置前台底部栏版权、链接和社交媒体地址，可控制显示和隐藏。</p>
        </Link>
      </div>

      <DatabaseUpdateButton />
    </div>
  )
}
