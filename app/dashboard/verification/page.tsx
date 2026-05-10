import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { AccountVerificationPanel } from '@/components/account-verification-panel'

export default async function DashboardVerificationPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')

  const supabase = createAdminClient()
  const { data: documents, error } = await supabase
    .from('user_kyc_documents')
    .select('id,document_type,original_filename,storage_url,status,review_note,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">邮箱与 KYC 验证</h1>
        <p className="mt-2 text-sm text-slate-500">完成邮箱验证码、企业营业执照上传和第三方 KYC 验证。</p>
      </div>
      <AccountVerificationPanel user={user} documents={documents ?? []} />
    </div>
  )
}
