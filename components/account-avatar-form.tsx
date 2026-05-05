'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'

const MAX_AVATAR_BYTES = 512 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('头像读取失败'))
    reader.readAsDataURL(file)
  })
}

export function AccountAvatarForm({ avatarUrl, fallbackLabel }: { avatarUrl?: string | null; fallbackLabel: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState(avatarUrl ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onFileChange(file?: File) {
    if (!file) return
    setError(null)
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('头像仅支持 PNG、JPG、WebP 或 GIF')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError('头像不能超过 512KB')
      return
    }

    const dataUrl = await readAsDataUrl(file)
    setPreview(dataUrl)
    setSaving(true)
    try {
      const response = await fetch('/api/account/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: dataUrl })
      })
      if (!response.ok) throw new Error(await response.text())
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '头像保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-2xl font-semibold text-blue-700">
        {preview ? <img src={preview} alt="账户头像" className="h-full w-full object-cover" /> : fallbackLabel.slice(0, 1).toUpperCase()}
      </div>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          className="hidden"
          onChange={(event) => void onFileChange(event.target.files?.[0])}
        />
        <button type="button" onClick={() => inputRef.current?.click()} disabled={saving} className="btn-secondary gap-2">
          <Upload className="h-4 w-4" />
          {saving ? '上传中...' : '上传头像'}
        </button>
        <p className="mt-2 text-xs text-slate-500">支持 PNG、JPG、WebP、GIF，最大 512KB。自定义头像不会被社交登录头像覆盖。</p>
        {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      </div>
    </div>
  )
}
