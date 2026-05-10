'use client'

import { useState } from 'react'
import { ArrowDownToLine, X } from 'lucide-react'
import { DownloadButton } from '@/components/download-button'
import { formatBytes } from '@/lib/format'

type DownloadLink = {
  id: string
  name: string
  file_size_bytes: number | null
  charge_traffic: boolean
}

export function DownloadLinkDialog({ links, disabled = false }: { links: DownloadLink[]; disabled?: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        disabled={disabled || links.length === 0}
        onClick={() => setOpen(true)}
        className="wise-button flex h-14 w-full items-center justify-center gap-3 text-lg font-black disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ArrowDownToLine className="h-6 w-6" />
        立即下载
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e0f0c]/35 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-[30px] border border-[#0e0f0c]/10 bg-white p-6 wise-ring">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#0e0f0c]">选择下载链接</h2>
                <p className="mt-1 text-sm font-semibold text-[#868685]">请选择后台配置的下载来源。</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#163300]/10 text-[#0e0f0c] hover:bg-[#163300]/15"
                aria-label="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              {links.map((link) => (
                <div key={link.id} className="rounded-[24px] border border-[#0e0f0c]/10 bg-[#f7f8f2] p-4">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-black text-[#0e0f0c]">{link.name}</p>
                      <p className="mt-1 text-xs font-semibold text-[#868685]">
                        {formatBytes(link.file_size_bytes)}
                        {link.charge_traffic ? ' · 扣用户流量' : ' · 不扣用户流量'}
                      </p>
                    </div>
                    <ArrowDownToLine className="h-5 w-5 shrink-0 text-[#55a630]" />
                  </div>
                  <DownloadButton linkId={link.id} label="下载此链接" className="wise-button flex h-11 w-full items-center justify-center text-sm font-black" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
