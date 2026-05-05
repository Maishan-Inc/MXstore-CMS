import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { CategoryManager } from '@/components/admin-content-managers'

export default async function AdminCategoriesPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('app_categories')
    .select('id,name,slug,icon,sort_order,enabled')
    .order('sort_order', { ascending: true })

  if (error) throw error

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">分类管理</h1>
        <p className="mt-2 text-sm text-slate-500">创建应用分类，并从图标库选择分类图标。</p>
      </div>
      <CategoryManager initialItems={data ?? []} />
    </div>
  )
}

