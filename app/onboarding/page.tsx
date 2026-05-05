import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { AccountIdentityPanel } from '@/components/account-identity-panel'
import { getAccountTypeLabel, getEnterpriseStatusLabel, getTeamPlanLabel } from '@/lib/account'

export default async function OnboardingPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role === 'admin') redirect('/admin')

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">选择你的账户身份</h1>
        <p className="mt-2 text-sm text-slate-500">身份一旦提升就不能降级。只有独立开发者、团队工作室和企业账号可以发布应用。</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_10px_26px_rgba(15,23,42,0.04)]">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">当前身份</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{getAccountTypeLabel(user.account_type)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">企业状态</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{getEnterpriseStatusLabel(user.enterprise_certification_status)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">团队套餐</p>
            <p className="mt-1 text-sm font-semibold text-slate-950">{getTeamPlanLabel(user.team_plan_status)}</p>
          </div>
        </div>
      </section>

      {user.account_type === 'enterprise' && user.enterprise_certification_status !== 'verified' ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-900">
          <h2 className="text-base font-semibold text-amber-950">企业认证处理中</h2>
          <p className="mt-2">请向客户服务支持提交营业执照、社会信用代码、公司名称、联系人信息等材料。材料不完整时，客服可能会继续要求你补充。</p>
          <p className="mt-2">审核通过后，企业身份会恢复为可用状态。</p>
        </section>
      ) : null}

      {user.account_type === 'team_studio' && user.team_plan_status !== 'active' ? (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-sm leading-7 text-blue-900">
          <h2 className="text-base font-semibold text-blue-950">团队版套餐未开通</h2>
          <p className="mt-2">团队工作室需要先购买团队版套餐，套餐生效后才能发布应用和继续使用团队身份。</p>
        </section>
      ) : null}

      <AccountIdentityPanel user={user} />
    </div>
  )
}
