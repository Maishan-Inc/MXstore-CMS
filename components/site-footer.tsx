import Link from 'next/link'
import { MxLogoMark } from '@/components/mx-logo-mark'
import { getFooterSettings, type FooterSocialId } from '@/lib/footer-settings'

function SocialIcon({ id }: { id: FooterSocialId }) {
  if (id === 'facebook') {
    return <path d="M21 12.1C21 7 17 3 11.9 3S3 7 3 12.1c0 4.5 3.2 8.3 7.5 9v-6.3H8.2v-2.7h2.3v-2c0-2.3 1.4-3.6 3.5-3.6 1 0 2 .2 2 .2V9h-1.1c-1.1 0-1.5.7-1.5 1.4v1.7h2.5l-.4 2.7h-2.1v6.3c4.3-.7 7.6-4.5 7.6-9Z" />
  }
  if (id === 'x') {
    return <path d="M14.4 10.6 21.6 3h-1.7l-6.2 6.6L8.7 3H3l7.6 10.1L3 21h1.7l6.7-7.1 5.3 7.1h5.7l-8-10.4Zm-2.4 2.5-.8-1.1L5.1 4.3h2.8l4.9 6.2.8 1.1 6.4 8.1h-2.8L12 13.1Z" />
  }
  if (id === 'instagram') {
    return <path d="M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H8Zm4 3.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm0 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm4-2.3a1.1 1.1 0 1 1 2.2 0 1.1 1.1 0 0 1-2.2 0Z" />
  }
  if (id === 'youtube') {
    return <path d="M21.6 7.2a3 3 0 0 0-2.1-2.1C17.7 4.6 12 4.6 12 4.6s-5.7 0-7.5.5a3 3 0 0 0-2.1 2.1A31.4 31.4 0 0 0 2 12a31.4 31.4 0 0 0 .4 4.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31.4 31.4 0 0 0 22 12a31.4 31.4 0 0 0-.4-4.8ZM10 15.4V8.6l5.8 3.4-5.8 3.4Z" />
  }
  if (id === 'linkedin') {
    return <path d="M6.6 8.8H3.2V21h3.4V8.8ZM4.9 3A2 2 0 1 0 5 7a2 2 0 0 0-.1-4Zm16 11.1c0-3.3-1.8-5.5-4.7-5.5a4 4 0 0 0-3.6 2h-.1V8.8H9.3V21h3.4v-6c0-1.6.3-3.2 2.3-3.2s2 1.9 2 3.3V21h3.4l.5-6.9Z" />
  }
  if (id === 'github') {
    return <path d="M12 2.5A9.5 9.5 0 0 0 9 21c.5.1.7-.2.7-.5v-1.7c-2.7.6-3.3-1.2-3.3-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.2 1.1 2.8.8.1-.6.3-1.1.6-1.3-2.2-.2-4.4-1.1-4.4-4.8 0-1.1.4-1.9 1-2.6-.1-.3-.4-1.2.1-2.6 0 0 .8-.3 2.7 1a9.2 9.2 0 0 1 4.8 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.3.1 2.6.6.7 1 1.5 1 2.6 0 3.7-2.3 4.6-4.4 4.8.4.3.7.9.7 1.8v2.6c0 .3.2.6.7.5A9.5 9.5 0 0 0 12 2.5Z" />
  }
  if (id === 'telegram') {
    return <path d="M21.7 4.3 18.4 20c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.2 9.4-8.5c.4-.4-.1-.6-.6-.2L5.8 13.4.8 11.8c-1.1-.3-1.1-1.1.2-1.6L20.5 2.7c.9-.3 1.7.2 1.2 1.6Z" />
  }
  return <path d="M18.8 5.2A16.3 16.3 0 0 0 14.7 4l-.2.4a15 15 0 0 1 3.6 1.7 12.5 12.5 0 0 0-12.2 0 14.6 14.6 0 0 1 3.6-1.7L9.3 4a16.3 16.3 0 0 0-4.1 1.2C2.6 9 1.9 12.7 2.3 16.4A16.5 16.5 0 0 0 7.4 19l.6-.9a10.7 10.7 0 0 1-1.6-.8l.4-.3a11.7 11.7 0 0 0 10.4 0l.4.3c-.5.3-1 .6-1.6.8l.6.9a16.5 16.5 0 0 0 5.1-2.6c.5-4.3-.7-7.9-2.9-11.2ZM8.7 14.2c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
}

export async function SiteFooter() {
  const settings = await getFooterSettings()
  if (!settings.enabled) return null

  const links = settings.links.filter((link) => link.enabled && link.href && link.label)
  const socials = settings.socials.filter((social) => social.enabled && social.href)

  return (
    <footer className="border-t border-[#0e0f0c]/10 bg-[#eef1ed] text-[#092400]">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="flex flex-col gap-10 border-b border-[#092400]/15 pb-12 md:flex-row md:items-start md:justify-between">
          <Link href="/" className="flex w-fit items-center gap-4">
            <MxLogoMark className="h-16 w-16" />
            <span className="text-5xl font-black leading-none text-[#103a00]">{settings.brandName}</span>
          </Link>

          {socials.length ? (
            <div className="flex flex-wrap gap-5">
              {socials.map((social) => (
                <a
                  key={social.id}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center text-[#103a00] transition hover:scale-110 hover:text-[#315729]"
                >
                  <svg viewBox="0 0 24 24" className="h-8 w-8 fill-current" aria-hidden="true">
                    <SocialIcon id={social.id} />
                  </svg>
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {links.length ? (
          <nav className="grid gap-x-12 gap-y-5 py-10 text-lg font-semibold md:grid-cols-4">
            {links.map((link) => (
              <Link key={`${link.label}-${link.href}`} href={link.href} className="w-fit text-[#092400] hover:text-[#315729]">
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="space-y-5 text-base font-medium leading-8 text-[#092400]">
          <p className="font-semibold">{settings.copyright}</p>
          {settings.description ? <p>{settings.description}</p> : null}
        </div>
      </div>
    </footer>
  )
}
