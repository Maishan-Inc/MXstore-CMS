import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { LoginProviderManager } from '@/components/admin-content-managers'

export default async function AdminLoginProvidersPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('login_providers')
    .select('id,provider_type,label,button_text,provider,connector_name,icon_url,sort_order,enabled')
    .order('sort_order', { ascending: true })

  if (error) throw error

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">第三方登录</h1>
        <p className="mt-2 text-sm text-slate-500">配置快捷登录方式、按钮文字、连接器名称和图标。OAuth 提供商仍需在 Supabase 控制台启用。</p>
      </div>
      <LoginProviderManager initialItems={data ?? []} />
    </div>
  )
}
