import { LoginPanel } from '@/components/login-panel'
import { MxLogoMark } from '@/components/mx-logo-mark'
import { Gift, Globe2, LogIn, ShieldCheck, Zap } from 'lucide-react'
import type { ReactNode } from 'react'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f7f8f2] px-6 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[1200px] items-center gap-12 lg:grid-cols-[560px_500px] xl:gap-20">
        <section className="hidden h-[650px] origin-left -translate-x-6 -translate-y-4 scale-[1.03] flex-col justify-start lg:flex">
          <div className="flex items-center gap-7">
            <MxLogoMark className="h-[88px] w-[88px]" />
            <p className="text-[56px] font-semibold leading-none tracking-normal text-[#0e0f0c]">MXStore</p>
          </div>

          <div className="mt-[42px]">
            <h1 className="text-[36px] font-semibold leading-tight tracking-normal text-[#0e0f0c]">安全分发你的数字应用</h1>
            <p className="mt-[24px] max-w-[540px] text-[20px] leading-[1.65] tracking-normal text-[#454745]">
              MXStore 既是面向开发者与团队的数字应用分发平台，也是普通人安全下载软件的超级平台。
            </p>
          </div>

          <div className="mt-[38px] space-y-[22px]">
            <FeatureItem icon={<ShieldCheck className="h-7 w-7" strokeWidth={2.5} />} title="安全审核" description="应用上架前进行安全校验，降低下载风险" />
            <FeatureItem icon={<Globe2 className="h-7 w-7" strokeWidth={2.5} />} title="全球数据中心" description="多区域节点支持，提升跨地区访问稳定性" />
            <FeatureItem icon={<Zap className="h-7 w-7" strokeWidth={2.5} />} title="高效分发" description="面向用户与团队的高速应用交付体验" />
            <FeatureItem icon={<LogIn className="h-7 w-7" strokeWidth={2.5} />} title="快捷登录" description="支持第三方账户与钱包快速注册/登录" />
            <FeatureItem icon={<Gift className="h-7 w-7" strokeWidth={2.5} />} title="Free层级" description="每月 2GB 下载权益" />
          </div>
        </section>

        <LoginPanel />
      </div>
    </div>
  )
}

function FeatureItem({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-center gap-[26px]">
      <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-[#e2f6d5] text-[#163300]">
        {icon}
      </div>
      <div>
        <h2 className="text-[19px] font-semibold leading-[1.2] tracking-normal text-[#0e0f0c]">{title}</h2>
        <p className="mt-[8px] text-[16px] leading-[1.45] tracking-normal text-[#454745]">{description}</p>
      </div>
    </div>
  )
}
