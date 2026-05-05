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
    <div>
      <LoginProviderManager initialItems={data ?? []} />
    </div>
  )
}
