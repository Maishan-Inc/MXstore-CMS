import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { getEmailSettings, toPublicEmailSettings } from '@/lib/email-settings'
import { EmailSettingsForm } from '@/components/email-settings-form'

export default async function AdminEmailSettingsPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const settings = toPublicEmailSettings(await getEmailSettings())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">邮箱系统</h1>
        <p className="mt-2 text-sm text-slate-500">配置 SMTP 邮箱、验证码邮件和认证审核通知模板。</p>
      </div>
      <EmailSettingsForm initialSettings={settings} />
    </div>
  )
}
