export function signedImageSrc(url: string | null | undefined) {
  if (!url) return null
  return `/api/openlist/image?url=${encodeURIComponent(url)}`
}
