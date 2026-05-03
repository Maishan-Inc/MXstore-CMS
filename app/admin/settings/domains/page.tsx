import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { DomainTokenForm } from '@/components/domain-token-form'
import { normalizeDomainPayload } from '@/lib/admin/domain-records'

export default async function DomainsPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()
  const { data: domains } = await supabase
    .from('token_domains')
    .select('id,domain,openlist_base_url,sign_ttl_seconds,enabled,created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">域名与 Token</h1>
        <p className="mt-2 text-sm text-slate-500">配置 OpenList 域名映射、签名 TTL 和启停状态；列表中不会回显管理员 Token 明文。</p>
      </div>
      <section className="card space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">新增域名配置</h2>
        <DomainTokenForm />
      </section>
      <section className="space-y-4">
        {domains?.map((domain) => (
          <div key={domain.id} className="card space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{domain.domain}</h2>
                <p className="text-sm text-slate-500">{domain.openlist_base_url} · TTL {domain.sign_ttl_seconds}s</p>
              </div>
              <span className={domain.enabled ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700' : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600'}>
                {domain.enabled ? '启用中' : '已停用'}
              </span>
            </div>
            <DomainTokenForm mode="edit" domainId={domain.id} initialValues={normalizeDomainPayload(domain)} />
          </div>
        ))}
        {!domains?.length ? <div className="card text-sm text-slate-500">还没有配置域名 Token。</div> : null}
      </section>
    </div>
  )
}
