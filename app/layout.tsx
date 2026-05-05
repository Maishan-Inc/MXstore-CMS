import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { headers } from 'next/headers'
import { WalletProvider } from '@/components/wallet-provider'
import { getCurrentStoreUser } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'MXStore',
  description: 'MXStore 应用商店 CMS 与签名下载系统'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers()
  const pathname = headerList.get('x-pathname') ?? ''
  const isHomePage = pathname === '/'
  const isInstallPage = pathname === '/install' || pathname.startsWith('/install/')
  const isLoginPage = pathname === '/login'

  // Install page gets its own full-screen layout without nav
  if (isInstallPage) {
    return (
      <html lang="zh-CN">
        <body>{children}</body>
      </html>
    )
  }

  if (isLoginPage) {
    return (
      <html lang="zh-CN">
        <body>
          <WalletProvider>{children}</WalletProvider>
        </body>
      </html>
    )
  }

  if (isHomePage) {
    return (
      <html lang="zh-CN">
        <body>
          <WalletProvider>{children}</WalletProvider>
        </body>
      </html>
    )
  }

  const user = await getCurrentStoreUser()

  return (
    <html lang="zh-CN">
      <body>
        <WalletProvider>
          <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
              <Link href="/" className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="MXStore" width={32} height={32} className="rounded-lg" priority />
                <span className="text-lg font-semibold text-slate-900">MXStore</span>
              </Link>
              <nav className="flex items-center gap-4 text-sm text-slate-600">
                {user?.role === 'admin' ? <Link href="/admin" className="hover:text-slate-900">管理员后台</Link> : null}
                {user ? (
                  <>
                    <Link href="/dashboard" className="hover:text-slate-900">用户后台</Link>
                    <form action="/auth/logout" method="post">
                      <button className="hover:text-slate-900">退出</button>
                    </form>
                  </>
                ) : (
                  <Link href="/login" className="hover:text-slate-900">登录</Link>
                )}
              </nav>
            </div>
          </header>
          <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 lg:px-6">{children}</main>
        </WalletProvider>
      </body>
    </html>
  )
}
