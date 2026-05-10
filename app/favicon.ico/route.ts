const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72">
  <defs>
    <linearGradient id="mx-favicon-green" x1="10" x2="52" y1="14" y2="60" gradientUnits="userSpaceOnUse">
      <stop stop-color="#9fe870"/>
      <stop offset="1" stop-color="#163300"/>
    </linearGradient>
  </defs>
  <rect width="72" height="72" rx="18" fill="#f7f8f2"/>
  <path d="M10 14h11.5c2.5 0 4.8 1.3 6.1 3.4L42 40.2 56.7 17c1.2-1.9 3.3-3 5.5-3h6.1L48.8 44.9l18 27.1H54.7c-2.4 0-4.7-1.2-6-3.2L10 14Z" fill="url(#mx-favicon-green)"/>
  <path d="M10 14h11.5c2.5 0 4.8 1.3 6.1 3.4L38 33.8 24.4 53.7c-1.3 1.9-3.4 3-5.6 3H10V14Z" fill="#163300"/>
  <path d="M39 38.1 55.4 14h12.9L47.8 44.9 39 38.1Z" fill="#9fe870"/>
  <path d="M28.3 48.1 39 32.3l9.1 13.5-10.9 15.9-8.9-13.6Z" fill="#e2f6d5"/>
</svg>`

export function GET() {
  return new Response(faviconSvg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  })
}
