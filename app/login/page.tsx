import { LoginPanel } from '@/components/login-panel'
import { Gift, Globe2, LogIn, ShieldCheck, Zap } from 'lucide-react'
import type { ReactNode } from 'react'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[1120px] items-center gap-12 lg:grid-cols-[500px_500px] xl:gap-16">
        <section className="hidden h-[560px] flex-col justify-start lg:flex">
          <div className="flex items-center gap-6">
            <MxLogoMark />
            <p className="text-[48px] font-semibold leading-none tracking-normal text-[#071638]">MXStore</p>
          </div>

          <div className="mt-[34px]">
            <h1 className="text-[30px] font-semibold leading-tight tracking-normal text-[#071638]">安全分发你的数字应用</h1>
            <p className="mt-[20px] max-w-[480px] text-[18px] leading-[1.6] tracking-normal text-[#66728a]">
              MXStore 既是面向开发者与团队的数字应用分发平台，也是普通人安全下载软件的超级平台。
            </p>
          </div>

          <div className="mt-[32px] space-y-[18px]">
            <FeatureItem icon={<ShieldCheck className="h-6 w-6" strokeWidth={2.5} />} title="安全审核" description="应用上架前进行安全校验，降低下载风险" />
            <FeatureItem icon={<Globe2 className="h-6 w-6" strokeWidth={2.5} />} title="全球数据中心" description="多区域节点支持，提升跨地区访问稳定性" />
            <FeatureItem icon={<Zap className="h-6 w-6" strokeWidth={2.5} />} title="高效分发" description="面向用户与团队的高速应用交付体验" />
            <FeatureItem icon={<LogIn className="h-6 w-6" strokeWidth={2.5} />} title="快捷登录" description="支持第三方账户与钱包快速注册/登录" />
            <FeatureItem icon={<Gift className="h-6 w-6" strokeWidth={2.5} />} title="Free层级" description="每月 2GB 下载权益" />
          </div>
        </section>

        <LoginPanel />
      </div>
    </div>
  )
}

function MxLogoMark() {
  return (
    <svg viewBox="0 0 72 72" className="h-[76px] w-[76px]" aria-hidden="true">
      <defs>
        <linearGradient id="mx-login-logo-blue" x1="10" x2="52" y1="14" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#004DFF" />
          <stop offset="1" stopColor="#2C74FF" />
        </linearGradient>
      </defs>
      <path d="M10 14h11.5c2.5 0 4.8 1.3 6.1 3.4L42 40.2 56.7 17c1.2-1.9 3.3-3 5.5-3h6.1L48.8 44.9l18 27.1H54.7c-2.4 0-4.7-1.2-6-3.2L10 14Z" fill="url(#mx-login-logo-blue)" />
      <path d="M10 14h11.5c2.5 0 4.8 1.3 6.1 3.4L38 33.8 24.4 53.7c-1.3 1.9-3.4 3-5.6 3H10V14Z" fill="#085BFF" />
      <path d="M39 38.1 55.4 14h12.9L47.8 44.9 39 38.1Z" fill="#3D7DFF" />
      <path d="M28.3 48.1 39 32.3l9.1 13.5-10.9 15.9-8.9-13.6Z" fill="#D9DEE7" />
    </svg>
  )
}

function FeatureItem({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-center gap-[22px]">
      <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[12px] bg-[#eef5ff] text-[#1267ff]">
        {icon}
      </div>
      <div>
        <h2 className="text-[17px] font-semibold leading-[1.2] tracking-normal text-[#071638]">{title}</h2>
        <p className="mt-[7px] text-[15px] leading-[1.35] tracking-normal text-[#66728a]">{description}</p>
      </div>
    </div>
  )
}
