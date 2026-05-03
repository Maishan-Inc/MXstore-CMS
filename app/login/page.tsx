import Link from 'next/link'
import { WalletLogin } from '@/components/wallet-login'

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">登录</h1>
        <p className="mt-2 text-sm text-slate-500">支持浏览器钱包插件登录和 Supabase OAuth 第三方登录。</p>
      </div>
      <section className="card space-y-4">
        <h2 className="font-semibold text-slate-900">钱包登录</h2>
        <WalletLogin />
      </section>
      <section className="card space-y-3">
        <h2 className="font-semibold text-slate-900">第三方登录</h2>
        <Link href="/auth/oauth?provider=github" className="btn-secondary w-full">使用 GitHub 登录</Link>
        <Link href="/auth/oauth?provider=google" className="btn-secondary w-full">使用 Google 登录</Link>
        <p className="text-xs text-slate-500">需要先在 Supabase Dashboard 配置 OAuth Provider。</p>
      </section>
    </div>
  )
}
