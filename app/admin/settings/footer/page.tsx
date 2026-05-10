import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { getFooterSettings } from '@/lib/footer-settings'
import { FooterSettingsForm } from '@/components/footer-settings-form'

export default async function FooterSettingsPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const settings = await getFooterSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">底部栏设置</h1>
        <p className="mt-2 text-sm text-slate-500">配置前台底部栏的版权信息、链接和社交媒体显示。</p>
      </div>
      <FooterSettingsForm initialSettings={settings} />
    </div>
  )
}
