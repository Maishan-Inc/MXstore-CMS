export const APP_DETAIL_COLUMNS = 'official_url,screenshot_urls,feature_highlights,changelog,release_date,language,license_name,system_requirements,rating_score,rating_count,download_count,show_on_recommended,recommendation_heat'

const DETAIL_FIELD_NAMES = [
  'official_url',
  'screenshot_urls',
  'feature_highlights',
  'changelog',
  'release_date',
  'language',
  'license_name',
  'system_requirements',
  'rating_score',
  'rating_count',
  'download_count',
  'show_on_recommended',
  'recommendation_heat'
]

type SupabaseLikeError = {
  code?: string
  message?: string
}

type AppDetailDefaults = {
  official_url: string | null
  screenshot_urls: string[]
  feature_highlights: string[]
  changelog: string | null
  release_date: string | null
  language: string | null
  license_name: string | null
  system_requirements: string | null
  rating_score: number
  rating_count: number
  download_count: number
  show_on_recommended: boolean
  recommendation_heat: number
}

export function isMissingAppDetailColumn(error: unknown) {
  const candidate = error as SupabaseLikeError | null
  const message = candidate?.message?.toLowerCase() ?? ''
  return candidate?.code === 'PGRST204' || DETAIL_FIELD_NAMES.some((field) => message.includes(field))
}

export function withAppDetailDefaults<T extends Record<string, unknown>>(app: T | null): (T & AppDetailDefaults) | null {
  if (!app) return app
  return {
    official_url: null,
    screenshot_urls: [],
    feature_highlights: [],
    changelog: null,
    release_date: null,
    language: null,
    license_name: null,
    system_requirements: null,
    rating_score: 4.8,
    rating_count: 0,
    download_count: 0,
    show_on_recommended: false,
    recommendation_heat: 0,
    ...app
  } as T & AppDetailDefaults
}

export function stripAppDetailPayload<T extends Record<string, unknown>>(payload: T) {
  const copy = { ...payload }
  for (const field of DETAIL_FIELD_NAMES) {
    delete copy[field]
  }
  return copy
}
