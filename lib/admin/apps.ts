export type AdminAppLinkInput = {
  id: string | null
  name: string
  input_url: string
  file_size_bytes: string
  charge_traffic: boolean
  sort_order: number
}

export type AdminAppFormValues = {
  name: string
  slug: string
  description: string
  version: string
  platform: string
  logo_url: string
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
            file_size_bytes: link.file_size_bytes ? String(link.file_size_bytes) : '',
            charge_traffic: link.charge_traffic,
            sort_order: link.sort_order
          }))
      : appFormDefaults().links
  }
}
