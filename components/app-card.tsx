import Link from 'next/link'
import { formatMoney } from '@/lib/format'
import { signedImageSrc } from '@/lib/openlist-image'

type AppCardProps = {
  app: {
    name: string
    slug: string
    description: string | null
    version: string | null
    is_paid: boolean
    price_cents: number | null
    currency: string | null
    logo_url: string | null
  }
}

export function AppCard({ app }: AppCardProps) {
  return (
    <Link href={`/app/${app.slug}`} className="card block hover:border-blue-200">
      <div className="flex gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xl font-semibold text-slate-700">
          {app.logo_url ? <img src={signedImageSrc(app.logo_url) ?? app.logo_url} alt="" className="h-full w-full rounded-2xl object-cover" /> : app.name.slice(0, 1)}
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">{app.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{app.description ?? '暂无描述'}</p>
          <div className="mt-3 flex gap-2 text-xs text-slate-500">
            {app.version ? <span>v{app.version}</span> : null}
            <span>{app.is_paid ? formatMoney(app.price_cents, app.currency ?? 'USD') : '免费'}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
