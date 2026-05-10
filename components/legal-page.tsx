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
    <div className="mx-auto max-w-7xl">
      <nav className="sticky top-0 z-30 -mx-4 border-b border-[#0e0f0c]/10 bg-[#f7f8f2]/95 px-4 py-4 backdrop-blur lg:-mx-6 lg:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="flex w-fit items-center gap-3">
            <MxLogoMark className="h-11 w-11" />
            <div>
              <p className="text-sm font-semibold text-[#868685]">MXStore Legal</p>
              <p className="text-lg font-black leading-none text-[#0e0f0c]">法律条款</p>
            </div>
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <Link
              href="/terms"
              className={`rounded-full px-4 py-2 ${title === '用户协议' ? 'bg-[#9fe870] text-[#163300]' : 'bg-[rgba(22,51,0,0.08)] text-[#454745] hover:text-[#0e0f0c]'}`}
            >
              用户协议
            </Link>
            <Link
              href="/privacy"
              className={`rounded-full px-4 py-2 ${title === '隐私政策' ? 'bg-[#9fe870] text-[#163300]' : 'bg-[rgba(22,51,0,0.08)] text-[#454745] hover:text-[#0e0f0c]'}`}
            >
              隐私政策
            </Link>
            <Link href="/" className="rounded-full px-4 py-2 text-[#454745] hover:bg-[rgba(22,51,0,0.08)] hover:text-[#0e0f0c]">
              返回首页
            </Link>
          </div>
        </div>
      </nav>

      <header className="border-b border-[#0e0f0c]/10 py-12 md:py-16">
        <p className="mb-5 text-base font-semibold text-[#163300]">最后更新：{updatedAt}</p>
        <h1 className="wise-display max-w-4xl text-[64px] text-[#0e0f0c] md:text-[112px]">{title}</h1>
        <p className="mt-8 max-w-3xl text-xl font-semibold leading-9 text-[#454745]">{subtitle}</p>
      </header>

      <section className="grid gap-10 py-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <p className="mb-4 text-sm font-black uppercase text-[#868685]">目录</p>
          <div className="grid gap-1 border-l border-[#0e0f0c]/10 pl-4">
            {sections.map((section, index) => (
              <a key={section.title} href={`#section-${index + 1}`} className="py-2 text-sm font-semibold leading-6 text-[#454745] hover:text-[#163300]">
                {String(index + 1).padStart(2, '0')} {section.title}
              </a>
            ))}
          </div>
          <div className="mt-8 border-t border-[#0e0f0c]/10 pt-5">
            <Link href={alternate.href} className="text-sm font-semibold text-[#163300] hover:text-[#0e0f0c]">
              {alternate.label}
            </Link>
          </div>
        </aside>

        <article className="min-w-0 bg-white px-6 py-8 md:px-10 md:py-10">
          {sections.map((section, index) => (
            <section key={section.title} id={`section-${index + 1}`} className={index === 0 ? 'scroll-mt-32' : 'scroll-mt-32 border-t border-[#0e0f0c]/10 pt-10 mt-10'}>
              <p className="mb-3 text-sm font-black text-[#163300]">{String(index + 1).padStart(2, '0')}</p>
              <h2 className="text-3xl font-black leading-tight text-[#0e0f0c] md:text-4xl">{section.title}</h2>
              <div className="mt-5 space-y-4 text-[17px] font-medium leading-8 text-[#454745]">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </article>
      </section>
    </div>
  )
}
