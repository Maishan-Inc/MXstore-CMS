'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { MxLogoMark } from '@/components/mx-logo-mark'

type SiteTopNavUser = {
  display_name: string | null
  email: string | null
  avatar_url: string | null
}

type SiteTopNavProps = {
  user: SiteTopNavUser | null
}

function displayNameFor(user: SiteTopNavUser) {
  return user.display_name?.trim() || user.email?.trim() || 'MXStore 用户'
}

export function SiteTopNav({ user }: SiteTopNavProps) {
  const [hidden, setHidden] = useState(false)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    lastScrollY.current = window.scrollY

    function onScroll() {
      if (ticking.current) return
      ticking.current = true

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY
        const delta = currentY - lastScrollY.current

        if (currentY < 24) {
          setHidden(false)
        } else if (delta > 8 && currentY > 96) {
          setHidden(true)
        } else if (delta < -8) {
          setHidden(false)
        }

        lastScrollY.current = currentY
        ticking.current = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const dashboardLabel = user ? displayNameFor(user) : ''

  return (
    <nav className={`sticky top-0 z-30 h-20 bg-[#103a00] transition-transform duration-300 ease-out will-change-transform ${hidden ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-white p-2 shadow-[rgba(14,15,12,0.18)_0_0_0_1px]">
            <MxLogoMark className="h-11 w-11" />
          </span>
          <span className="text-xl font-black text-white">MXStore</span>
        </Link>

        {user?.avatar_url ? (
          <Link
            href="/dashboard"
            aria-label="进入用户后台"
            className="flex min-w-0 items-center gap-3 rounded-full bg-white/10 py-1 pl-4 pr-1 text-white transition hover:scale-105 hover:bg-white/15"
          >
            <span className="hidden max-w-[180px] truncate text-sm font-black leading-none text-[#ffffff] sm:block">{dashboardLabel}</span>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#9fe870] p-1">
              <img src={user.avatar_url} alt={dashboardLabel} className="h-full w-full rounded-full object-cover" />
            </span>
          </Link>
        ) : user ? (
          <Link
            href="/dashboard"
            className="inline-flex h-11 max-w-[220px] items-center justify-center truncate rounded-full bg-[#103a00] px-7 text-base font-black text-[#ffffff] transition hover:scale-105 hover:bg-[#163300]"
          >
            <span className="truncate text-[#ffffff]">{dashboardLabel}</span>
          </Link>
        ) : (
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#9fe870] px-7 text-base font-black text-[#163300] transition hover:scale-105 hover:bg-[#cdffad]"
          >
            登录
          </Link>
        )}
      </div>
    </nav>
  )
}
