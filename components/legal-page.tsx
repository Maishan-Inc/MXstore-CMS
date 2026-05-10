import Link from 'next/link'
import { SiteFooter } from '@/components/site-footer'

type LegalSection = {
  title: string
  body: string[]
}

type LegalPageProps = {
  title: string
  subtitle: string
  updatedAt: string
  sections: LegalSection[]
}

export async function LegalPage({ title, subtitle, updatedAt, sections }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-[#eef1ed] text-[#092400]">
      <nav className="sticky top-0 z-30 h-20 bg-[#103a00]">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-end px-6">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#9fe870] px-7 text-base font-black text-[#163300] transition hover:scale-105 hover:bg-[#cdffad]"
          >
            登录
          </Link>
        </div>
      </nav>

      <header className="mx-auto max-w-[1420px] border-b border-[#092400]/10 px-6 py-12 md:py-16">
        <div className="ml-0 max-w-[960px] lg:ml-[360px]">
          <p className="mb-5 text-base font-black text-[#103a00]">最后更新：{updatedAt}</p>
          <h1 className="text-[48px] font-black leading-[1.05] text-[#092400] md:text-[72px]">{title}</h1>
          <p className="mt-7 max-w-3xl text-xl font-semibold leading-9 text-[#183b12]">{subtitle}</p>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1420px] gap-10 px-6 py-10 lg:grid-cols-[300px_minmax(0,960px)] lg:gap-[60px]">
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <p className="mb-4 text-sm font-black uppercase text-[#315729]">目录</p>
          <div className="grid gap-1 border-l border-[#092400]/15 pl-4">
            {sections.map((section, index) => (
              <a key={section.title} href={`#section-${index + 1}`} className="py-2 text-[15px] font-black leading-6 text-[#092400] underline decoration-[#9fe870] decoration-2 underline-offset-2 hover:text-[#315729]">
                {String(index + 1).padStart(2, '0')} {section.title}
              </a>
            ))}
          </div>
        </aside>

        <article className="min-w-0">
          {sections.map((section, index) => (
            <section key={section.title} id={`section-${index + 1}`} className={index === 0 ? 'scroll-mt-32' : 'scroll-mt-32 border-t border-[#092400]/10 pt-10 mt-10'}>
              <h2 className="text-[26px] font-black leading-tight text-[#001b00] md:text-[30px]">{index + 1}. {section.title}</h2>
              <div className="mt-5 space-y-5 text-[18px] font-medium leading-[1.72] text-[#1d2d29]">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </article>
      </section>
      <SiteFooter />
    </div>
  )
}
