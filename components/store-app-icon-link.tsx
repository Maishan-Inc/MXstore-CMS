import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { signedImageSrc } from '@/lib/openlist-image'

type StoreAppIconLinkProps = {
  app: {
    name: string
    slug: string
    logo_url: string | null
  }
  icon: LucideIcon
  tone: string
}

export function StoreAppIconLink({ app, icon: Icon, tone }: StoreAppIconLinkProps) {
  const logoSrc = signedImageSrc(app.logo_url)

  return (
    <Link href={`/app/${app.slug}`} className="group flex min-w-0 flex-col items-center justify-start px-1 py-2 text-center">
      <div className={`flex h-16 w-16 items-center justify-center rounded-[18px] bg-gradient-to-br ${tone} shadow-[0_10px_22px_rgb(37_99_235_/_0.14)] transition group-hover:-translate-y-0.5`}>
        {logoSrc ? (
          <img src={logoSrc} alt="" className="h-full w-full rounded-[18px] object-cover" />
        ) : (
          <Icon className="h-9 w-9 text-white" strokeWidth={2.4} />
        )}
      </div>
      <span className="mt-3 max-w-full truncate text-sm font-semibold leading-5 text-slate-950">{app.name}</span>
    </Link>
  )
}
