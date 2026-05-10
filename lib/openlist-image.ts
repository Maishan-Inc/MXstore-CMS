export function signedImageSrc(url: string | null | undefined, openlistDomain?: string | null) {
  if (!url) return null
  const trimmedUrl = url.trim()
  if (!trimmedUrl) return null
  if (trimmedUrl.startsWith('data:') || trimmedUrl.startsWith('blob:')) return trimmedUrl

  const domain = openlistDomain?.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
  const resolvedUrl = domain && trimmedUrl.startsWith('/')
    ? `https://${domain}${trimmedUrl}`
    : trimmedUrl

  if (!/^https?:\/\//i.test(resolvedUrl)) return resolvedUrl
  return `/api/openlist/image?url=${encodeURIComponent(resolvedUrl)}`
}
