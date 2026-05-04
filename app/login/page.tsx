import { LoginPanel } from '@/components/login-panel'
import { ShieldCheck, UsersRound, Zap } from 'lucide-react'
import type { ReactNode } from 'react'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white px-6 py-12">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] w-full max-w-[1242px] items-center gap-14 lg:grid-cols-[560px_622px]">
        <section className="hidden h-[620px] flex-col justify-start lg:flex">
          <div className="flex items-center gap-10">
            <div className="flex h-[109px] w-[114px] items-center justify-center rounded-[16px] border border-slate-200 bg-white shadow-[0_18px_34px_rgba(15,23,42,0.12)]">
              <MxLogoMark />
            </div>
            <p className="text-[56px] font-semibold leading-none tracking-normal text-[#071638]">MXStore</p>
          </div>

          <div className="mt-[42px]">
            <h1 className="text-[34px] font-semibold leading-tight tracking-normal text-[#071638]">安全分发你的数字应用</h1>
            <p className="mt-[24px] max-w-[520px] text-[20px] leading-[1.6] tracking-normal text-[#66728a]">
              MXStore 是面向开发者与团队的数字应用分发平台，
              <br />
              专注于安全、可靠与高效的应用交付体验。
            </p>
          </div>

          <div className="mt-[36px] space-y-[38px]">
            <FeatureItem icon={<ShieldCheck className="h-7 w-7" strokeWidth={2.5} />} title="安全可靠" description="多重安全防护，保障应用与数据安全" />
            <FeatureItem icon={<Zap className="h-7 w-7" strokeWidth={2.5} />} title="高效分发" description="全球加速分发，快速触达你的用户" />
            <FeatureItem icon={<UsersRound className="h-7 w-7" strokeWidth={2.5} />} title="团队协作" description="精细化权限管理，提升团队协作效率" />
          </div>
        </section>

        <LoginPanel />
      </div>
    </div>
  )
}

function MxLogoMark() {
  return (
    <svg viewBox="0 0 72 72" className="h-[72px] w-[72px]" aria-hidden="true">
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
    <div className="flex items-center gap-[30px]">
      <div className="flex h-[51px] w-[51px] items-center justify-center rounded-[13px] bg-[#eef5ff] text-[#1267ff]">
        {icon}
      </div>
      <div>
        <h2 className="text-[18px] font-semibold leading-[1.2] tracking-normal text-[#071638]">{title}</h2>
        <p className="mt-[10px] text-[17px] leading-none tracking-normal text-[#66728a]">{description}</p>
      </div>
    </div>
  )
}
