import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminUserDetailForm } from '@/components/admin-user-detail-form'

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentStoreUser()
  if (!admin) redirect('/login')
  if (admin.role !== 'admin') redirect('/dashboard')

  const { id } = await params
  const supabase = createAdminClient()
  const [{ data: user, error: userError }, { data: documents, error: documentsError }, { data: sessions, error: sessionsError }] = await Promise.all([
    supabase
      .from('store_users')
      .select('id,email,display_name,wallet_address,role,account_type,developer_name,organization_name,enterprise_certification_status,enterprise_certification_note,team_plan_status,identity_plan_tier,identity_plan_status,kyc_status,kyc_note,download_quota_bytes,distribution_quota_bytes,distribution_charge_threshold_bytes,created_at')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('user_kyc_documents')
      .select('id,document_type,original_filename,storage_url,status,review_note,created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_kyc_sessions')
      .select('id,provider_session_id,provider_status,verification_url,created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(5)
  ])

  if (userError) throw userError
  if (documentsError) throw documentsError
  if (sessionsError) throw sessionsError
  if (!user) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="text-sm font-medium text-slate-500 hover:text-slate-900">返回用户列表</Link>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">用户详情</h1>
        <p className="mt-2 text-sm text-slate-500">{user.email ?? user.wallet_address ?? user.id}</p>
      </div>

      <AdminUserDetailForm user={user} documents={documents ?? []} />

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Didit 会话</h2>
        <div className="divide-y divide-slate-200 rounded-xl border border-slate-200">
          {sessions?.map((session) => (
            <div key={session.id} className="flex flex-col gap-2 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-900">{session.provider_session_id ?? session.id}</p>
                <p className="mt-1 text-xs text-slate-500">{session.provider_status ?? 'unknown'} · {new Date(session.created_at).toLocaleString()}</p>
              </div>
              {session.verification_url ? <a href={session.verification_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600">打开会话</a> : null}
            </div>
          ))}
          {!sessions?.length ? <p className="p-4 text-sm text-slate-500">暂无 Didit 会话。</p> : null}
        </div>
      </section>
    </div>
  )
}
