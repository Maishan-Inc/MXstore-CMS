import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { WalletProvider } from '@/components/wallet-provider'
import { MxLogoMark } from '@/components/mx-logo-mark'
import { ActionFeedback } from '@/components/action-feedback'
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

  const user = await getCurrentStoreUser()

  return (
    <html lang="zh-CN">
      <body>
        <WalletProvider>
          <header className="border-b border-[#0e0f0c]/10 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
              <Link href="/" className="flex items-center gap-2.5">
                <MxLogoMark className="h-10 w-10" />
                <span className="text-lg font-black text-[#0e0f0c]">MXStore</span>
              </Link>
              <nav className="flex items-center gap-3 text-sm font-semibold text-[#454745]">
                {user?.role === 'admin' ? <Link href="/admin" className="wise-subtle-button px-4 py-2">管理员后台</Link> : null}
                {user ? (
                  <>
                    <Link href="/dashboard" className="wise-subtle-button px-4 py-2">用户后台</Link>
                    <form action="/auth/logout" method="post">
                      <button className="wise-subtle-button px-4 py-2">退出</button>
                    </form>
                  </>
                ) : (
                  <Link href="/login" className="wise-button px-4 py-2">登录</Link>
                )}
              </nav>
            </div>
          </header>
          <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 lg:px-6">{children}</main>
        </WalletProvider>
        <ActionFeedback />
      </body>
    </html>
  )
}
