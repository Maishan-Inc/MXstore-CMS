import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { getKycSettings, toPublicKycSettings } from '@/lib/kyc-settings'
import { KycSettingsForm } from '@/components/kyc-settings-form'

export default async function AdminKycSettingsPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const settings = toPublicKycSettings(await getKycSettings())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">KYC 验证配置</h1>
        <p className="mt-2 text-sm text-slate-500">配置 Didit.me KYC、营业执照上传和远程 S3 存储。</p>
      </div>
      <KycSettingsForm initialSettings={settings} />
    </div>
  )
}
