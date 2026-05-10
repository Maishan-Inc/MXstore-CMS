import './globals.css'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { WalletProvider } from '@/components/wallet-provider'
import { ActionFeedback } from '@/components/action-feedback'
import { SiteFooter } from '@/components/site-footer'
import { SiteTopNav } from '@/components/site-top-nav'
import { getCurrentStoreUser } from '@/lib/auth'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'MXStore',
  description: 'MXStore 应用商店 CMS 与签名下载系统',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.svg'
  },
  openGraph: {
    title: 'MXStore',
    description: 'MXStore 应用商店 CMS 与签名下载系统',
    siteName: 'MXStore',
    images: [{ url: '/favicon.svg', width: 72, height: 72, alt: 'MXStore' }]
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers()
  const pathname = headerList.get('x-pathname') ?? ''
  const isHomePage = pathname === '/'
  const isInstallPage = pathname === '/install' || pathname.startsWith('/install/')
  const isLoginPage = pathname === '/login'
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/')
  const isDashboardPage = pathname === '/dashboard' || pathname.startsWith('/dashboard/')
  const isLegalPage = pathname === '/terms' || pathname === '/privacy'
  const isAppDetailPage = pathname.startsWith('/app/')

  // Install page gets its own full-screen layout without nav
  if (isInstallPage) {
    return (
      <html lang="zh-CN">
        <body>
          {children}
          <ActionFeedback />
        </body>
      </html>
    )
  }

  if (isLoginPage) {
    return (
      <html lang="zh-CN">
        <body>
          <WalletProvider>{children}</WalletProvider>
          <ActionFeedback />
        </body>
      </html>
    )
  }

  if (isAdminPage) {
    return (
      <html lang="zh-CN">
        <body>
          {children}
          <ActionFeedback />
        </body>
      </html>
    )
  }

  if (isDashboardPage) {
    return (
      <html lang="zh-CN">
        <body>
          <WalletProvider>{children}</WalletProvider>
          <ActionFeedback />
        </body>
      </html>
    )
  }

  if (isHomePage) {
    return (
      <html lang="zh-CN">
        <body>
          <WalletProvider>{children}</WalletProvider>
          <ActionFeedback />
        </body>
      </html>
    )
  }

  if (isLegalPage) {
    return (
      <html lang="zh-CN">
        <body>
          {children}
          <ActionFeedback />
        </body>
      </html>
    )
  }

  const user = await getCurrentStoreUser()

  return (
    <html lang="zh-CN">
      <body>
        <WalletProvider>
          <div className={isAppDetailPage ? 'min-h-screen bg-[#eef1ed]' : undefined}>
            <SiteTopNav user={user ? { display_name: user.display_name, email: user.email, avatar_url: user.avatar_url } : null} />
            <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 lg:px-6">{children}</main>
            <SiteFooter variant={isAppDetailPage ? 'legal' : 'default'} />
          </div>
        </WalletProvider>
        <ActionFeedback />
      </body>
    </html>
  )
}
