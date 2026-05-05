import 'server-only'

export function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required env: ${name}`)
  return value
}

export function appUrl(origin?: string): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? origin ?? 'http://localhost:3000'
}
