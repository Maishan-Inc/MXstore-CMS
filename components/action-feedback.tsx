'use client'

import { useEffect, useState } from 'react'

type FeedbackTone = 'success' | 'error'
type FeedbackToast = {
  message: string
  tone: FeedbackTone
}

const START_EVENT = 'mxstore:action-feedback:start'
const FINISH_EVENT = 'mxstore:action-feedback:finish'
const STORED_SUCCESS_KEY = 'mxstore:action-feedback:success'

export function startActionFeedback() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(START_EVENT))
}

export function finishActionFeedback(message: string, tone: FeedbackTone = 'success') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(FINISH_EVENT, { detail: { message, tone } }))
}

export function persistActionSuccess(message: string) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(STORED_SUCCESS_KEY, message)
}

export function ActionFeedback() {
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<FeedbackToast | null>(null)

  useEffect(() => {
    const storedSuccess = window.sessionStorage.getItem(STORED_SUCCESS_KEY)
    if (storedSuccess) {
      window.sessionStorage.removeItem(STORED_SUCCESS_KEY)
      setToast({ message: storedSuccess, tone: 'success' })
    }

    function onStart() {
      setToast(null)
      setLoading(true)
    }

    function onFinish(event: Event) {
      const detail = (event as CustomEvent<FeedbackToast>).detail
      setLoading(false)
      setToast({
        message: detail?.message ?? '操作已完成',
        tone: detail?.tone ?? 'success'
      })
    }

    window.addEventListener(START_EVENT, onStart)
    window.addEventListener(FINISH_EVENT, onFinish)
    return () => {
      window.removeEventListener(START_EVENT, onStart)
      window.removeEventListener(FINISH_EVENT, onFinish)
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3600)
    return () => window.clearTimeout(timer)
  }, [toast])

  return (
    <>
      {loading ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-white/35 backdrop-blur-md">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white wise-ring">
            <span className="h-10 w-10 animate-spin rounded-full border-[5px] border-[#e2f6d5] border-t-[#163300]" />
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          className={`fixed right-5 top-5 z-[100] w-[min(360px,calc(100vw-2.5rem))] rounded-[24px] border bg-white p-5 wise-ring ${
            toast.tone === 'success' ? 'border-[#9fe870]' : 'border-rose-200'
          } animate-[mx-toast-slide_360ms_ease-out]`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                toast.tone === 'success' ? 'bg-[#9fe870] text-[#163300]' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {toast.tone === 'success' ? '✓' : '!'}
            </span>
            <div>
              <p className="text-sm font-semibold text-[#868685]">{toast.tone === 'success' ? '操作完成' : '操作失败'}</p>
              <p className="mt-1 text-base font-semibold leading-6 text-[#0e0f0c]">{toast.message}</p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
