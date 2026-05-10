import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import { hmac } from '@/lib/crypto'
import { generateEmailCode } from '@/lib/email-verification'
import { sendConfiguredEmail } from '@/lib/smtp'

const REGISTRATION_CODE_TTL_MINUTES = 10
const REGISTRATION_CODE_TTL_MS = REGISTRATION_CODE_TTL_MINUTES * 60 * 1000
const REGISTRATION_CODE_RESEND_SECONDS = 60

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function hashRegistrationCode(email: string, code: string) {
  return hmac(`password_registration:${normalizeEmail(email)}:${code.trim()}`)
}

export async function hasStoreUserWithEmail(email: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('store_users')
    .select('id')
    .eq('email', normalizeEmail(email))
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

export async function sendPasswordRegistrationCode(email: string) {
  const normalizedEmail = normalizeEmail(email)
  const supabase = createAdminClient()
  const recentThreshold = new Date(Date.now() - REGISTRATION_CODE_RESEND_SECONDS * 1000).toISOString()
  const { data: recent, error: recentError } = await supabase
    .from('password_registration_codes')
    .select('id')
    .eq('email', normalizedEmail)
    .gte('created_at', recentThreshold)
    .limit(1)
    .maybeSingle()
  if (recentError) throw recentError
  if (recent) throw new Error(`验证码发送过于频繁，请 ${REGISTRATION_CODE_RESEND_SECONDS} 秒后再试`)

  const code = generateEmailCode()
  const expiresAt = new Date(Date.now() + REGISTRATION_CODE_TTL_MS).toISOString()
  const { error } = await supabase
    .from('password_registration_codes')
    .insert({
      email: normalizedEmail,
      code_hash: hashRegistrationCode(normalizedEmail, code),
      expires_at: expiresAt
    })
  if (error) throw error

  await sendConfiguredEmail('verification_code', normalizedEmail, {
    name: normalizedEmail,
    code,
    expiresMinutes: REGISTRATION_CODE_TTL_MINUTES
  })

  return { expiresAt, cooldownSeconds: REGISTRATION_CODE_RESEND_SECONDS }
}

export async function verifyPasswordRegistrationCode(email: string, code: string) {
  const normalizedEmail = normalizeEmail(email)
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('password_registration_codes')
    .select('id,code_hash,expires_at')
    .eq('email', normalizedEmail)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('请先发送注册验证码')
  if (new Date(data.expires_at).getTime() < Date.now()) throw new Error('注册验证码已过期')
  if (data.code_hash !== hashRegistrationCode(normalizedEmail, code)) throw new Error('注册验证码不正确')

  return data.id as string
}

export async function consumePasswordRegistrationCode(codeId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('password_registration_codes')
    .update({ consumed_at: new Date().toISOString() })
    .eq('id', codeId)
  if (error) throw error
}
