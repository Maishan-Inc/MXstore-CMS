import type { SVGProps } from 'react'

type MxLogoMarkProps = SVGProps<SVGSVGElement>

export function MxLogoMark({ className = 'h-10 w-10', ...props }: MxLogoMarkProps) {
  return (
    <svg viewBox="0 0 72 72" className={className} aria-hidden="true" {...props}>
      <defs>
        <linearGradient id="mx-logo-green" x1="10" x2="52" y1="14" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9fe870" />
          <stop offset="1" stopColor="#163300" />
        </linearGradient>
      </defs>
      <path d="M10 14h11.5c2.5 0 4.8 1.3 6.1 3.4L42 40.2 56.7 17c1.2-1.9 3.3-3 5.5-3h6.1L48.8 44.9l18 27.1H54.7c-2.4 0-4.7-1.2-6-3.2L10 14Z" fill="url(#mx-logo-green)" />
      <path d="M10 14h11.5c2.5 0 4.8 1.3 6.1 3.4L38 33.8 24.4 53.7c-1.3 1.9-3.4 3-5.6 3H10V14Z" fill="#163300" />
      <path d="M39 38.1 55.4 14h12.9L47.8 44.9 39 38.1Z" fill="#9fe870" />
      <path d="M28.3 48.1 39 32.3l9.1 13.5-10.9 15.9-8.9-13.6Z" fill="#e2f6d5" />
    </svg>
  )
}
