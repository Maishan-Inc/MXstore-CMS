import Link from 'next/link'
import { MxLogoMark } from '@/components/mx-logo-mark'

type LegalSection = {
  title: string
  body: string[]
}

type LegalPageProps = {
  title: string
  subtitle: string
  updatedAt: string
  sections: LegalSection[]
  alternate: {
    href: string
    label: string
  }
}

export function LegalPage({ title, subtitle, updatedAt, sections, alternate }: LegalPageProps) {
  return (
    <div className="mx-auto max-w-5xl">
      <section className="rounded-[40px] border border-[#0e0f0c]/10 bg-white p-7 wise-ring md:p-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-8 flex items-center gap-4">
              <MxLogoMark className="h-14 w-14" />
              <div>
                <p className="text-sm font-semibold text-[#868685]">MXStore Legal</p>
                <p className="text-xl font-black text-[#0e0f0c]">MXStore</p>
              </div>
            </div>
            <h1 className="wise-display text-[56px] text-[#0e0f0c] md:text-[84px]">{title}</h1>
            <p className="mt-7 max-w-3xl text-lg font-semibold leading-8 text-[#454745]">{subtitle}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 md:items-end">
            <span className="rounded-full bg-[#e2f6d5] px-5 py-3 text-sm font-semibold text-[#163300]">
              最后更新：{updatedAt}
            </span>
            <Link href={alternate.href} className="wise-subtle-button px-5 py-3 text-sm font-semibold">
              {alternate.label}
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-5">
        {sections.map((section, index) => (
          <article key={section.title} className="rounded-[30px] border border-[#0e0f0c]/10 bg-white p-6 wise-ring">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#9fe870] text-sm font-black text-[#163300]">
                {index + 1}
              </span>
              <h2 className="text-2xl font-black text-[#0e0f0c]">{section.title}</h2>
            </div>
            <div className="space-y-3 text-base font-medium leading-8 text-[#454745]">
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
