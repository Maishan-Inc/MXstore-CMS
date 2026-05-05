import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowDownToLine, CheckCircle2, LockKeyhole, ShieldCheck, Tag, UserRound } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStoreUser } from '@/lib/auth'
import { DownloadButton } from '@/components/download-button'
import { AppPurchaseButton } from '@/components/app-purchase-button'
import { formatBytes, formatMoney } from '@/lib/format'
import { signedImageSrc } from '@/lib/openlist-image'

type DownloadPermission = 'public' | 'login' | 'purchase'

function permissionCopy(permission: DownloadPermission) {
  if (permission === 'public') return { label: '免登录下载', description: '无需登录即可获取下载链接。', icon: CheckCircle2 }
  if (permission === 'purchase') return { label: '购买后下载', description: '购买或获得授权后才能下载。', icon: LockKeyhole }
  return { label: '登录后下载', description: '登录账户后即可下载并记录流量。', icon: UserRound }
}

export default async function AppDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data: app, error } = await supabase
    .from('apps')
    .select('id,name,slug,description,version,platform,category_id,download_permission,is_paid,price_cents,currency,logo_url,developer_name,developer_avatar_url,published,app_categories(name,icon),app_links(id,name,input_url,file_size_bytes,charge_traffic,sort_order)')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  if (!app || !app.published) notFound()

  const links = [...(app.app_links ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const category = Array.isArray(app.app_categories) ? app.app_categories[0] : app.app_categories
  const permission = (app.download_permission ?? (app.is_paid ? 'purchase' : 'login')) as DownloadPermission
  const permissionInfo = permissionCopy(permission)
  const PermissionIcon = permissionInfo.icon
  const logoSrc = signedImageSrc(app.logo_url)
  const developerAvatarSrc = signedImageSrc(app.developer_avatar_url)

  const currentUser = await getCurrentStoreUser()
  let hasEntitlement = false
  if (currentUser && permission === 'purchase') {
    const { data: ent } = await supabase
      .from('app_entitlements')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('app_id', app.id)
      .maybeSingle()
    hasEntitlement = !!ent
  }

  const canDownload = permission === 'public' || (permission === 'login' && !!currentUser) || (permission === 'purchase' && hasEntitlement)

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
        <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-10">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-4xl font-semibold text-blue-600">
              {logoSrc ? <img src={logoSrc} alt="" className="h-full w-full rounded-2xl object-cover" /> : app.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  <Tag className="h-3.5 w-3.5" />
                  {category?.name ?? app.platform ?? '未分类'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {permissionInfo.label}
                </span>
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950">{app.name}</h1>
              <div className="mt-4 flex items-center justify-center gap-3 sm:justify-start">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-sm font-semibold text-slate-700">
                  {developerAvatarSrc ? <img src={developerAvatarSrc} alt="" className="h-full w-full object-cover" /> : (app.developer_name ?? app.name).slice(0, 1)}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{app.developer_name ?? '开发者'}</p>
                  <p className="text-xs text-slate-500">发布者信息</p>
                </div>
              </div>
              <p className="mt-3 text-base text-slate-500">
                版本 {app.version ?? '未知'} · {permission === 'purchase' ? formatMoney(app.price_cents, app.currency ?? 'USD') : '免费'}
              </p>
              <p className="mt-6 max-w-3xl whitespace-pre-wrap text-base leading-8 text-slate-600">{app.description ?? '暂无介绍'}</p>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-3 rounded-xl bg-white p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <PermissionIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-950">{permissionInfo.label}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">{permissionInfo.description}</p>
              </div>
            </div>

            {permission === 'login' && !currentUser ? (
              <Link href="/login" className="btn mt-4 w-full gap-2">
                <UserRound className="h-4 w-4" />
                登录后下载
              </Link>
            ) : null}

            {permission === 'purchase' && !hasEntitlement ? (
              <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
                <p className="mb-3 text-sm text-orange-800">该应用需要购买或管理员授权后才能下载。</p>
                {currentUser ? (
                  <AppPurchaseButton
                    appId={app.id}
                    payToAddress="0x0000000000000000000000000000000000000000"
                    amountRaw={String(app.price_cents)}
                    chainId={8453}
                  />
                ) : (
                  <Link href="/login" className="btn w-full">登录并购买</Link>
                )}
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-950">下载链接</h2>
          <span className="text-sm text-slate-500">{links.length} 个可用链接</span>
        </div>
        {links.length === 0 ? <p className="text-sm text-slate-500">暂无下载链接。</p> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {links.map((link) => (
            <div key={link.id} className="rounded-2xl border border-slate-200 p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-950">{link.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatBytes(link.file_size_bytes)}{link.charge_traffic ? ' · 扣流量' : ' · 不扣流量'}</p>
                </div>
                <ArrowDownToLine className="h-5 w-5 text-slate-400" />
              </div>
              {canDownload ? (
                <DownloadButton linkId={link.id} label="立即下载" />
              ) : (
                <button disabled className="btn-secondary w-full cursor-not-allowed opacity-60">暂无权限</button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
