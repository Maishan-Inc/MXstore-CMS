import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { decryptSecret, encryptSecret } from '@/lib/crypto'

export const EMAIL_SETTINGS_KEY = 'email_config'

export type EmailTemplateKey =
  | 'verification_code'
  | 'identity_approved'
  | 'identity_rejected'
  | 'identity_needs_more_info'

export type EmailTemplate = {
  subject: string
  body: string
}

export type EmailSettings = {
  enabled: boolean
  host: string
  port: number
  secure: boolean
  startTls: boolean
  username: string
  encryptedPassword: string | null
  fromEmail: string
  fromName: string
  templates: Record<EmailTemplateKey, EmailTemplate>
}

export type EmailSettingsInput = Omit<EmailSettings, 'encryptedPassword'> & {
  password?: string
  keepPassword?: boolean
}

export type PublicEmailSettings = Omit<EmailSettings, 'encryptedPassword'> & {
  hasPassword: boolean
}

export const defaultEmailSettings: EmailSettings = {
  enabled: false,
  host: '',
  port: 587,
  secure: false,
  startTls: true,
  username: '',
  encryptedPassword: null,
  fromEmail: '',
  fromName: 'MXStore',
  templates: {
    verification_code: {
      subject: 'MXStore 邮箱验证码',
      body: '你好，{{name}}：\n\n你的 MXStore 邮箱验证码是 {{code}}，{{expiresMinutes}} 分钟内有效。\n\n如果不是你本人操作，请忽略此邮件。'
    },
    identity_approved: {
      subject: 'MXStore 认证已通过',
      body: '你好，{{name}}：\n\n你的 {{accountType}} 认证已通过，现在可以继续使用对应权益。'
    },
    identity_rejected: {
      subject: 'MXStore 认证未通过',
      body: '你好，{{name}}：\n\n你的 {{accountType}} 认证未通过。\n\n原因：{{note}}'
    },
    identity_needs_more_info: {
      subject: 'MXStore 认证需要补充材料',
      body: '你好，{{name}}：\n\n你的 {{accountType}} 认证需要补充材料。\n\n说明：{{note}}'
    }
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function normalizeTemplate(value: unknown, fallback: EmailTemplate): EmailTemplate {
  if (!isObject(value)) return fallback
  return {
    subject: typeof value.subject === 'string' && value.subject ? value.subject : fallback.subject,
    body: typeof value.body === 'string' && value.body ? value.body : fallback.body
  }
}

export function normalizeEmailSettings(value: unknown): EmailSettings {
  if (!isObject(value)) return defaultEmailSettings
  const templates = isObject(value.templates) ? value.templates : {}
  return {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : defaultEmailSettings.enabled,
    host: typeof value.host === 'string' ? value.host : '',
    port: typeof value.port === 'number' ? value.port : defaultEmailSettings.port,
    secure: typeof value.secure === 'boolean' ? value.secure : defaultEmailSettings.secure,
    startTls: typeof value.startTls === 'boolean' ? value.startTls : defaultEmailSettings.startTls,
    username: typeof value.username === 'string' ? value.username : '',
    encryptedPassword: typeof value.encryptedPassword === 'string' && value.encryptedPassword ? value.encryptedPassword : null,
    fromEmail: typeof value.fromEmail === 'string' ? value.fromEmail : '',
    fromName: typeof value.fromName === 'string' ? value.fromName : defaultEmailSettings.fromName,
    templates: {
      verification_code: normalizeTemplate(templates.verification_code, defaultEmailSettings.templates.verification_code),
      identity_approved: normalizeTemplate(templates.identity_approved, defaultEmailSettings.templates.identity_approved),
      identity_rejected: normalizeTemplate(templates.identity_rejected, defaultEmailSettings.templates.identity_rejected),
      identity_needs_more_info: normalizeTemplate(templates.identity_needs_more_info, defaultEmailSettings.templates.identity_needs_more_info)
    }
  }
}

export async function getEmailSettings() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', EMAIL_SETTINGS_KEY)
    .maybeSingle()

  if (error || !data?.value) return defaultEmailSettings
  try {
    return normalizeEmailSettings(JSON.parse(data.value))
  } catch {
    return defaultEmailSettings
  }
}

export function toPublicEmailSettings(settings: EmailSettings): PublicEmailSettings {
  const { encryptedPassword, ...publicSettings } = settings
  return { ...publicSettings, hasPassword: Boolean(encryptedPassword) }
}

export function getSmtpPassword(settings: EmailSettings) {
  if (!settings.encryptedPassword) return ''
  return decryptSecret(settings.encryptedPassword)
}

export async function saveEmailSettings(input: EmailSettingsInput) {
  const current = await getEmailSettings()
  const settings: EmailSettings = {
    ...input,
    encryptedPassword: input.password
      ? encryptSecret(input.password)
      : input.keepPassword
        ? current.encryptedPassword
        : null
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('system_settings')
    .upsert({
      key: EMAIL_SETTINGS_KEY,
      value: JSON.stringify(settings),
      group_name: 'email',
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' })

  if (error) throw error
  return settings
}

export function renderEmailTemplate(template: EmailTemplate, variables: Record<string, string | number | null | undefined>) {
  const render = (text: string) => text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => String(variables[key] ?? ''))
  return {
    subject: render(template.subject),
    body: render(template.body)
  }
}
