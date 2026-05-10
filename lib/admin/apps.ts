export type AdminAppLinkInput = {
  id: string | null
  name: string
  input_url: string
  file_size_bytes: string
  file_size_unit: FileSizeUnit
  charge_traffic: boolean
  sort_order: number
}

export type FileSizeUnit = 'MB' | 'GB'

export type AdminAppFormValues = {
  name: string
  slug: string
  description: string
  version: string
  platform: string
  logo_url: string
  official_url: string
  screenshot_urls: string
  feature_highlights: string
  changelog: string
  release_date: string
  language: string
  license_name: string
  system_requirements: string
  rating_score: number
  rating_count: number
  download_count: number
  show_on_recommended: boolean
  recommendation_heat: number
  developer_name: string
  developer_avatar_url: string
  category_id: string
  download_permission: 'public' | 'login' | 'purchase'
  is_paid: boolean
  price_cents: number
  currency: string
  published: boolean
  links: AdminAppLinkInput[]
}

type ExistingApp = {
  name: string
  slug: string
  description: string | null
  version: string | null
  platform: string | null
  logo_url: string | null
  official_url?: string | null
  screenshot_urls?: string[] | null
  feature_highlights?: string[] | null
  changelog?: string | null
  release_date?: string | null
  language?: string | null
  license_name?: string | null
  system_requirements?: string | null
  rating_score?: number | null
  rating_count?: number | null
  download_count?: number | null
  show_on_recommended?: boolean | null
  recommendation_heat?: number | null
  developer_name?: string | null
  developer_avatar_url?: string | null
  category_id?: string | null
  download_permission?: 'public' | 'login' | 'purchase' | null
  is_paid: boolean
  price_cents: number
  currency: string | null
  published: boolean
  app_links?: Array<{
    id: string
    name: string
    input_url: string
    file_size_bytes: number | null
    charge_traffic: boolean
    sort_order: number
  }> | null
}

export function appFormDefaults(): AdminAppFormValues {
  return {
    name: '',
    slug: '',
    description: '',
    version: '',
    platform: '',
    logo_url: '',
    official_url: '',
    screenshot_urls: '',
    feature_highlights: '',
    changelog: '',
    release_date: '',
    language: '简体中文',
    license_name: '免费',
    system_requirements: '',
    rating_score: 4.8,
    rating_count: 0,
    download_count: 0,
    show_on_recommended: false,
    recommendation_heat: 0,
    developer_name: '',
    developer_avatar_url: '',
    category_id: '',
    download_permission: 'login',
    is_paid: false,
    price_cents: 0,
    currency: 'USD',
    published: true,
    links: [
      {
            id: null,
            name: '主下载',
            input_url: '',
            file_size_bytes: '',
            file_size_unit: 'GB',
            charge_traffic: true,
            sort_order: 0
          }
    ]
  }
}

export function normalizeAppPayload(app: ExistingApp): AdminAppFormValues {
  return {
    name: app.name,
    slug: app.slug,
    description: app.description ?? '',
    version: app.version ?? '',
    platform: app.platform ?? '',
    logo_url: app.logo_url ?? '',
    official_url: app.official_url ?? '',
    screenshot_urls: formatMultiline(app.screenshot_urls),
    feature_highlights: formatMultiline(app.feature_highlights),
    changelog: app.changelog ?? '',
    release_date: app.release_date ?? '',
    language: app.language ?? '简体中文',
    license_name: app.license_name ?? '免费',
    system_requirements: app.system_requirements ?? '',
    rating_score: Number(app.rating_score ?? 4.8),
    rating_count: Number(app.rating_count ?? 0),
    download_count: Number(app.download_count ?? 0),
    show_on_recommended: Boolean(app.show_on_recommended),
    recommendation_heat: Number(app.recommendation_heat ?? 0),
    developer_name: app.developer_name ?? '',
    developer_avatar_url: app.developer_avatar_url ?? '',
    category_id: app.category_id ?? '',
    download_permission: app.download_permission ?? (app.is_paid ? 'purchase' : 'login'),
    is_paid: app.is_paid,
    price_cents: app.price_cents,
    currency: app.currency ?? 'USD',
    published: app.published,
    links: app.app_links?.length
      ? app.app_links
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((link) => ({
            id: link.id,
            name: link.name,
            input_url: link.input_url,
            ...formatFileSizeForInput(link.file_size_bytes),
            charge_traffic: link.charge_traffic,
            sort_order: link.sort_order
          }))
      : appFormDefaults().links
  }
}

export function fileSizeInputToBytes(value: string, unit: FileSizeUnit) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  const multiplier = unit === 'GB' ? 1024 ** 3 : 1024 ** 2
  return Math.round(parsed * multiplier)
}

export function formatFileSizeForInput(bytes: number | null): Pick<AdminAppLinkInput, 'file_size_bytes' | 'file_size_unit'> {
  if (!bytes || bytes <= 0) return { file_size_bytes: '', file_size_unit: 'GB' }
  if (bytes >= 1024 ** 3) {
    return { file_size_bytes: trimFileSize(bytes / 1024 ** 3), file_size_unit: 'GB' }
  }
  return { file_size_bytes: trimFileSize(bytes / 1024 ** 2, 4), file_size_unit: 'MB' }
}

function trimFileSize(value: number, digits = 2) {
  return value.toFixed(digits).replace(/\.?0+$/, '')
}

function formatMultiline(values: string[] | null | undefined) {
  return values?.filter(Boolean).join('\n') ?? ''
}
