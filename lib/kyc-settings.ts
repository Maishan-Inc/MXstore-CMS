import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret, encryptSecret } from '@/lib/crypto'

export const KYC_SETTINGS_KEY = 'kyc_config'

export type KycSettings = {
  didit: {
    enabled: boolean
    apiKeyEncrypted: string | null
    webhookSecretEncrypted: string | null
    baseUrl: string
    workflowId: string
  }
  s3: {
    enabled: boolean
    endpoint: string
    region: string
    bucket: string
    prefix: string
    accessKeyId: string
    secretAccessKeyEncrypted: string | null
    publicBaseUrl: string
    pathStyle: boolean
  }
}

export type KycSettingsInput = {
  didit: Omit<KycSettings['didit'], 'apiKeyEncrypted' | 'webhookSecretEncrypted'> & {
    apiKey?: string
    keepApiKey?: boolean
    webhookSecret?: string
    keepWebhookSecret?: boolean
  }
  s3: Omit<KycSettings['s3'], 'secretAccessKeyEncrypted'> & {
    secretAccessKey?: string
    keepSecretAccessKey?: boolean
  }
}

export type PublicKycSettings = {
  didit: Omit<KycSettings['didit'], 'apiKeyEncrypted' | 'webhookSecretEncrypted'> & { hasApiKey: boolean; hasWebhookSecret: boolean }
  s3: Omit<KycSettings['s3'], 'secretAccessKeyEncrypted'> & { hasSecretAccessKey: boolean }
}

export const defaultKycSettings: KycSettings = {
  didit: {
    enabled: false,
    apiKeyEncrypted: null,
    webhookSecretEncrypted: null,
    baseUrl: 'https://verification.didit.me',
    workflowId: ''
  },
  s3: {
    enabled: false,
    endpoint: '',
    region: 'auto',
    bucket: '',
    prefix: 'kyc',
    accessKeyId: '',
    secretAccessKeyEncrypted: null,
    publicBaseUrl: '',
    pathStyle: true
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeKycSettings(value: unknown): KycSettings {
  if (!isObject(value)) return defaultKycSettings
  const didit = isObject(value.didit) ? value.didit : {}
  const s3 = isObject(value.s3) ? value.s3 : {}
  return {
    didit: {
      enabled: typeof didit.enabled === 'boolean' ? didit.enabled : false,
      apiKeyEncrypted: typeof didit.apiKeyEncrypted === 'string' && didit.apiKeyEncrypted ? didit.apiKeyEncrypted : null,
      webhookSecretEncrypted: typeof didit.webhookSecretEncrypted === 'string' && didit.webhookSecretEncrypted ? didit.webhookSecretEncrypted : null,
      baseUrl: typeof didit.baseUrl === 'string' && didit.baseUrl ? didit.baseUrl : defaultKycSettings.didit.baseUrl,
      workflowId: typeof didit.workflowId === 'string' ? didit.workflowId : ''
    },
    s3: {
      enabled: typeof s3.enabled === 'boolean' ? s3.enabled : false,
      endpoint: typeof s3.endpoint === 'string' ? s3.endpoint : '',
      region: typeof s3.region === 'string' && s3.region ? s3.region : defaultKycSettings.s3.region,
      bucket: typeof s3.bucket === 'string' ? s3.bucket : '',
      prefix: typeof s3.prefix === 'string' && s3.prefix ? s3.prefix : defaultKycSettings.s3.prefix,
      accessKeyId: typeof s3.accessKeyId === 'string' ? s3.accessKeyId : '',
      secretAccessKeyEncrypted: typeof s3.secretAccessKeyEncrypted === 'string' && s3.secretAccessKeyEncrypted ? s3.secretAccessKeyEncrypted : null,
      publicBaseUrl: typeof s3.publicBaseUrl === 'string' ? s3.publicBaseUrl : '',
      pathStyle: typeof s3.pathStyle === 'boolean' ? s3.pathStyle : true
    }
  }
}

export async function getKycSettings() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', KYC_SETTINGS_KEY)
    .maybeSingle()

  if (error || !data?.value) return defaultKycSettings
  try {
    return normalizeKycSettings(JSON.parse(data.value))
  } catch {
    return defaultKycSettings
  }
}

export function toPublicKycSettings(settings: KycSettings): PublicKycSettings {
  return {
    didit: {
      enabled: settings.didit.enabled,
      baseUrl: settings.didit.baseUrl,
      workflowId: settings.didit.workflowId,
      hasApiKey: Boolean(settings.didit.apiKeyEncrypted),
      hasWebhookSecret: Boolean(settings.didit.webhookSecretEncrypted)
    },
    s3: {
      enabled: settings.s3.enabled,
      endpoint: settings.s3.endpoint,
      region: settings.s3.region,
      bucket: settings.s3.bucket,
      prefix: settings.s3.prefix,
      accessKeyId: settings.s3.accessKeyId,
      publicBaseUrl: settings.s3.publicBaseUrl,
      pathStyle: settings.s3.pathStyle,
      hasSecretAccessKey: Boolean(settings.s3.secretAccessKeyEncrypted)
    }
  }
}

export function getDiditApiKey(settings: KycSettings) {
  return settings.didit.apiKeyEncrypted ? decryptSecret(settings.didit.apiKeyEncrypted) : ''
}

export function getDiditWebhookSecret(settings: KycSettings) {
  return settings.didit.webhookSecretEncrypted ? decryptSecret(settings.didit.webhookSecretEncrypted) : ''
}

export function getS3SecretAccessKey(settings: KycSettings) {
  return settings.s3.secretAccessKeyEncrypted ? decryptSecret(settings.s3.secretAccessKeyEncrypted) : ''
}

export async function saveKycSettings(input: KycSettingsInput) {
  const current = await getKycSettings()
  const settings: KycSettings = {
    didit: {
      enabled: input.didit.enabled,
      baseUrl: input.didit.baseUrl,
      workflowId: input.didit.workflowId,
      apiKeyEncrypted: input.didit.apiKey
        ? encryptSecret(input.didit.apiKey)
        : input.didit.keepApiKey
          ? current.didit.apiKeyEncrypted
          : null,
      webhookSecretEncrypted: input.didit.webhookSecret
        ? encryptSecret(input.didit.webhookSecret)
        : input.didit.keepWebhookSecret
          ? current.didit.webhookSecretEncrypted
          : null
    },
    s3: {
      enabled: input.s3.enabled,
      endpoint: input.s3.endpoint,
      region: input.s3.region,
      bucket: input.s3.bucket,
      prefix: input.s3.prefix,
      accessKeyId: input.s3.accessKeyId,
      publicBaseUrl: input.s3.publicBaseUrl,
      pathStyle: input.s3.pathStyle,
      secretAccessKeyEncrypted: input.s3.secretAccessKey
        ? encryptSecret(input.s3.secretAccessKey)
        : input.s3.keepSecretAccessKey
          ? current.s3.secretAccessKeyEncrypted
          : null
    }
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('system_settings')
    .upsert({
      key: KYC_SETTINGS_KEY,
      value: JSON.stringify(settings),
      group_name: 'kyc',
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' })

  if (error) throw error
  return settings
}
