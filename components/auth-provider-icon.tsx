'use client'

type ProviderIconProps = {
  id: string
  label: string
  src?: string
}

export function AuthProviderIcon({ id, label, src }: ProviderIconProps) {
  if (src) {
    return <img src={src} alt="" className="h-5 w-5 rounded-[4px]" aria-hidden="true" />
  }

  if (id === 'github') return <GitHubIcon />
  if (id === 'google') return <GoogleIcon />

  return (
    <span
      className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-slate-100 text-[10px] font-semibold text-slate-600"
      aria-hidden="true"
    >
      {label.slice(0, 1)}
    </span>
  )
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-900" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5A11.5 11.5 0 0 0 8.36 22.9c.58.11.79-.25.79-.56v-2.02c-3.22.7-3.9-1.38-3.9-1.38-.53-1.34-1.29-1.69-1.29-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.29-5.27-1.29-5.27-5.73 0-1.27.45-2.3 1.19-3.11-.12-.29-.52-1.47.11-3.07 0 0 .97-.31 3.17 1.19a10.95 10.95 0 0 1 5.78 0c2.2-1.5 3.17-1.19 3.17-1.19.63 1.6.23 2.78.11 3.07.74.81 1.19 1.84 1.19 3.11 0 4.46-2.71 5.43-5.29 5.72.42.36.79 1.07.79 2.16v3.05c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .5Z"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.61 6.61 0 0 1 0-4.22V7.04H2.18a11 11 0 0 0 0 9.92l3.66-2.85Z" />
      <path fill="#EA4335" d="M12 5.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.58 10.58 0 0 0 12 1 11 11 0 0 0 2.18 7.04l3.66 2.85C6.71 7.29 9.14 5.36 12 5.36Z" />
    </svg>
  )
}
