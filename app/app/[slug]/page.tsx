import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowDownToLine,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileText,
  Globe2,
  HardDriveDownload,
  Heart,
  Info,
  LockKeyhole,
  Monitor,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  UserRound
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentStoreUser } from '@/lib/auth'
import { AppPurchaseButton } from '@/components/app-purchase-button'
import { DownloadLinkDialog } from '@/components/download-link-dialog'
import { formatBytes, formatMoney } from '@/lib/format'
import { signedImageSrc } from '@/lib/openlist-image'

type DownloadPermission = 'public' | 'login' | 'purchase'

type AppLink = {
  id: string
  name: string
  file_size_bytes: number | null
  charge_traffic: boolean
  sort_order: number
}

function permissionCopy(permission: DownloadPermission) {
  if (permission === 'public') return { label: '免登录下载', description: '无需登录即可获取下载链接。', icon: CheckCircle2 }
  if (permission === 'purchase') return { label: '购买后下载', description: '购买或获得授权后才能下载。', icon: LockKeyhole }
  return { label: '登录后下载', description: '登录账户后即可下载并记录流量。', icon: UserRound }
}

function formatCount(value: number) {
  if (value >= 10000) return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}万+`
  return `${value}`
}

function formatDate(value: string | null | undefined) {
  if (!value) return '未设置'
  return value.slice(0, 10)
}

function splitLines(value: string | null | undefined) {
  return value?.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) ?? []
}

function normalizeHighlights(values: string[] | null | undefined) {
  const source = values?.length ? values : ['高速下载：多线路下载引擎', '安全可靠：后台签名生成下载链接', '清晰管理：版本、截图和更新日志统一维护', '流畅体验：简洁的应用详情展示']
  return source.map((item) => {
    const [title, ...rest] = item.split(/[:：]/)
    return {
      title: title.trim(),
      description: rest.join('：').trim()
    }
  })
}

export default async function AppDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data: app, error } = await supabase
    .from('apps')
    .select('id,name,slug,description,version,platform,category_id,download_permission,is_paid,price_cents,currency,logo_url,official_url,screenshot_urls,feature_highlights,changelog,release_date,language,license_name,system_requirements,rating_score,rating_count,download_count,developer_name,developer_avatar_url,published,app_categories(name,icon),app_links(id,name,file_size_bytes,charge_traffic,sort_order)')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw error
  if (!app || !app.published) notFound()

  const downloadCountResult = await supabase
    .from('download_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('app_id', app.id)

  const links = [...(app.app_links ?? [])].sort((a: AppLink, b: AppLink) => a.sort_order - b.sort_order)
  const category = Array.isArray(app.app_categories) ? app.app_categories[0] : app.app_categories
  const permission = (app.download_permission ?? (app.is_paid ? 'purchase' : 'login')) as DownloadPermission
  const permissionInfo = permissionCopy(permission)
  const PermissionIcon = permissionInfo.icon
  const logoSrc = signedImageSrc(app.logo_url)
  const developerAvatarSrc = signedImageSrc(app.developer_avatar_url)
  const screenshots = (app.screenshot_urls ?? []).map((url: string) => signedImageSrc(url) ?? url)
  const highlights = normalizeHighlights(app.feature_highlights)
  const changelogLines = splitLines(app.changelog)
  const primarySize = links.find((link) => link.file_size_bytes)?.file_size_bytes ?? null
  const totalDownloads = Number(app.download_count ?? 0) + Number(downloadCountResult.count ?? 0)
  const ratingCount = Number(app.rating_count ?? 0)

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
    <div className="space-y-5">
      <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#868685]">
        <Link href="/" className="hover:text-[#163300]">首页</Link>
        <span>›</span>
        <Link href="/apps" className="hover:text-[#163300]">应用</Link>
        <span>›</span>
        <span>{category?.name ?? app.platform ?? '未分类'}</span>
        <span>›</span>
        <span className="text-[#0e0f0c]">{app.name}</span>
      </nav>

      <section className="rounded-[36px] border border-[#0e0f0c]/10 bg-white p-6 wise-ring lg:p-9">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
          <div className="flex flex-col gap-7 md:flex-row">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-[30px] bg-[#e2f6d5] text-5xl font-black text-[#163300] wise-ring md:h-40 md:w-40">
              {logoSrc ? <img src={logoSrc} alt="" className="h-full w-full object-cover" /> : app.name.slice(0, 1)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e2f6d5] px-3 py-1 text-xs font-black text-[#163300]">
                  <Monitor className="h-3.5 w-3.5" />
                  {app.platform ?? '全平台'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#163300]/10 px-3 py-1 text-xs font-black text-[#163300]">
                  <Tag className="h-3.5 w-3.5" />
                  {category?.name ?? '效率工具'}
                </span>
              </div>

              <h1 className="wise-display text-[52px] text-[#0e0f0c] md:text-[72px]">{app.name}</h1>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold text-[#454745]">
                <span className="inline-flex items-center gap-2 text-[#163300]">
                  <BadgeCheck className="h-5 w-5 fill-[#1a73e8] text-white" />
                  {app.developer_name ?? 'MXStore'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-[#55a630] text-[#55a630]" />
                  {Number(app.rating_score ?? 4.8).toFixed(1)}
                </span>
                <span>{formatCount(ratingCount)} 评价</span>
                <span className="inline-flex items-center gap-1.5">
                  <HardDriveDownload className="h-4 w-4 text-[#55a630]" />
                  {formatCount(totalDownloads)} 下载
                </span>
              </div>

              <p className="mt-4 text-sm font-semibold text-[#868685]">
                版本 {app.version ?? '未知'} <span className="px-2">|</span> 大小 {formatBytes(primarySize)} <span className="px-2">|</span> {permission === 'purchase' ? formatMoney(app.price_cents, app.currency ?? 'USD') : '免费'}
              </p>

              <p className="mt-6 max-w-3xl whitespace-pre-wrap text-base font-semibold leading-8 text-[#454745]">{app.description ?? '暂无介绍'}</p>
            </div>
          </div>

          <aside className="rounded-[28px] border border-[#0e0f0c]/10 bg-[#f7f8f2] p-6 wise-ring">
            <div className="mb-5 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e2f6d5] text-[#55a630]">
                <PermissionIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#0e0f0c]">{permissionInfo.label}</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-[#454745]">{permissionInfo.description}</p>
              </div>
            </div>

            {permission === 'login' && !currentUser ? (
              <Link href="/login" className="wise-button flex h-14 w-full items-center justify-center gap-2 text-lg font-black">
                <UserRound className="h-5 w-5" />
                登录后下载
              </Link>
            ) : null}

            {permission === 'purchase' && !hasEntitlement ? (
              <div className="rounded-[24px] border border-orange-200 bg-orange-50 p-4">
                <p className="mb-3 text-sm font-semibold text-orange-800">该应用需要购买或管理员授权后才能下载。</p>
                {currentUser ? (
                  <AppPurchaseButton appId={app.id} payToAddress="0x0000000000000000000000000000000000000000" amountRaw={String(app.price_cents)} chainId={8453} />
                ) : (
                  <Link href="/login" className="wise-button flex h-12 w-full items-center justify-center font-black">登录并购买</Link>
                )}
              </div>
            ) : null}

            {(permission === 'public' || (permission === 'login' && currentUser) || (permission === 'purchase' && hasEntitlement)) ? (
              <DownloadLinkDialog links={links} disabled={!canDownload} />
            ) : null}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" className="wise-subtle-button flex h-12 items-center justify-center gap-2 text-sm font-black">
                <Heart className="h-5 w-5" />
                收藏
              </button>
              {app.official_url ? (
                <Link href={app.official_url} className="wise-subtle-button flex h-12 items-center justify-center gap-2 text-sm font-black">
                  <Globe2 className="h-5 w-5" />
                  官网
                </Link>
              ) : (
                <button type="button" disabled className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#163300]/5 text-sm font-black text-[#868685]">
                  <Globe2 className="h-5 w-5" />
                  官网
                </button>
              )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#0e0f0c]/10 pt-5 text-xs font-black text-[#454745]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#55a630]" />
                安全扫描
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-[#55a630]" />
                官方正版
              </div>
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-[#55a630]" />
                {app.platform ?? '多平台'}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <InfoCard icon={FileText} label="版本" value={app.version ?? '未知'} />
        <InfoCard icon={HardDriveDownload} label="文件大小" value={formatBytes(primarySize)} />
        <InfoCard icon={CalendarDays} label="更新时间" value={formatDate(app.release_date)} />
        <InfoCard icon={ArrowDownToLine} label="下载量" value={formatCount(totalDownloads)} />
        <InfoCard icon={Monitor} label="系统支持" value={app.system_requirements ?? app.platform ?? '未设置'} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-[30px] border border-[#0e0f0c]/10 bg-white p-6 wise-ring">
          {screenshots.length ? (
            <>
              <h2 className="mb-4 text-xl font-black text-[#0e0f0c]">应用截图</h2>
              <div className="grid gap-4 md:grid-cols-3">
                {screenshots.slice(0, 3).map((url: string) => (
                  <div key={url} className="aspect-video overflow-hidden rounded-[18px] border border-[#0e0f0c]/10 bg-[#f7f8f2]">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <div className={screenshots.length ? 'mt-8' : ''}>
            <h2 className="text-xl font-black text-[#0e0f0c]">应用介绍</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm font-semibold leading-7 text-[#454745]">{app.description ?? '暂无介绍'}</p>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-black text-[#0e0f0c]">功能亮点</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {highlights.map((item) => (
                <div key={`${item.title}-${item.description}`} className="flex gap-3">
                  <Sparkles className="mt-1 h-6 w-6 shrink-0 text-[#55a630]" />
                  <div>
                    <h3 className="font-black text-[#0e0f0c]">{item.title}</h3>
                    {item.description ? <p className="mt-1 text-xs font-semibold leading-5 text-[#868685]">{item.description}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[30px] border border-[#0e0f0c]/10 bg-white p-6 wise-ring">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-black text-[#0e0f0c]">
              <FileText className="h-5 w-5" />
              版本信息
            </h2>
            <dl className="space-y-4 text-sm font-semibold">
              <InfoRow label="当前版本" value={app.version ?? '未知'} />
              <InfoRow label="更新日期" value={formatDate(app.release_date)} />
              <InfoRow label="开发者" value={app.developer_name ?? 'MXStore'} />
              <InfoRow label="语言" value={app.language ?? '未设置'} />
              <InfoRow label="授权方式" value={app.license_name ?? (permission === 'purchase' ? '付费' : '免费')} />
            </dl>
          </section>

          <section className="rounded-[30px] border border-[#0e0f0c]/10 bg-white p-6 wise-ring">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-black text-[#0e0f0c]">
                <BookOpen className="h-5 w-5" />
                更新日志
              </h2>
            </div>
            <p className="mb-4 text-sm font-black text-[#0e0f0c]">v{app.version ?? '未知'} <span className="ml-3 text-[#868685]">{formatDate(app.release_date)}</span></p>
            {changelogLines.length ? (
              <ul className="space-y-2 text-sm font-semibold leading-6 text-[#454745]">
                {changelogLines.map((line) => <li key={line}>• {line}</li>)}
              </ul>
            ) : (
              <p className="text-sm font-semibold text-[#868685]">暂无更新日志。</p>
            )}
          </section>

          <section className="rounded-[30px] border border-[#0e0f0c]/10 bg-[#f7f8f2] p-6 wise-ring">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-black text-[#0e0f0c]">
              <Info className="h-5 w-5 text-[#55a630]" />
              下载说明
            </h2>
            <ul className="space-y-2 text-sm font-semibold leading-6 text-[#454745]">
              <li>• 点击「立即下载」后选择需要的后台下载链接。</li>
              <li>• OpenList 链接由服务端生成临时签名地址。</li>
              <li>• 需要登录或购买的应用会先完成权限校验。</li>
              <li>• 如遇问题，请访问官网或联系应用发布者。</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}

function InfoCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-[20px] border border-[#0e0f0c]/10 bg-white px-5 py-4 wise-ring">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e2f6d5] text-[#55a630]">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-black text-[#868685]">{label}</p>
        <p className="truncate text-sm font-black text-[#0e0f0c]">{value}</p>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-[#868685]">{label}</dt>
      <dd className="text-right text-[#454745]">{value}</dd>
    </div>
  )
}
