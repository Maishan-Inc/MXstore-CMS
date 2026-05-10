import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { AccountIdentityPanel } from '@/components/account-identity-panel'
import { getAccountTypeLabel, getEnterpriseStatusLabel, getTeamPlanLabel } from '@/lib/account'
import { getIdentityPlanSettings } from '@/lib/identity-plan-settings'

export default async function OnboardingPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role === 'admin') redirect('/admin')
  const identityPlanSettings = await getIdentityPlanSettings()

  return (
    <div id="identity-top" className="mx-auto max-w-[1500px] space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-4xl font-black text-[#0e0f0c] sm:text-5xl">{identityPlanSettings.pageTitle}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#454745]">{identityPlanSettings.pageSubtitle}</p>
      </div>

      <section className="flex flex-wrap gap-3 text-sm font-semibold text-[#454745]">
        <div className="rounded-full border border-[#0e0f0c]/10 bg-white px-4 py-2 shadow-[rgba(14,15,12,0.12)_0_0_0_1px]">
          当前身份：<span className="text-[#0e0f0c]">{getAccountTypeLabel(user.account_type)}</span>
        </div>
        <div className="rounded-full border border-[#0e0f0c]/10 bg-white px-4 py-2 shadow-[rgba(14,15,12,0.12)_0_0_0_1px]">
          企业状态：<span className="text-[#0e0f0c]">{getEnterpriseStatusLabel(user.enterprise_certification_status)}</span>
        </div>
        <div className="rounded-full border border-[#0e0f0c]/10 bg-white px-4 py-2 shadow-[rgba(14,15,12,0.12)_0_0_0_1px]">
          团队套餐：<span className="text-[#0e0f0c]">{getTeamPlanLabel(user.team_plan_status)}</span>
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

      <AccountIdentityPanel user={user} settings={identityPlanSettings} />
    </div>
  )
}
