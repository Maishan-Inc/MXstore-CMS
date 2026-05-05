import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { AdminAppForm } from '@/components/admin-app-form'

export default async function NewAppPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()
  const { data: categories } = await supabase
    .from('app_categories')
    .select('id,name')
    .eq('enabled', true)
    .order('sort_order', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">上架应用</h1>
        <p className="mt-2 text-sm text-slate-500">一个应用可以创建多个下载链接，每个链接都有独立名称、大小和是否扣流量。</p>
      </div>
      <AdminAppForm categories={categories ?? []} />
    </div>
  )
}
