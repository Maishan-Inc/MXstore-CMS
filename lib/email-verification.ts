import 'server-only'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { hmac } from '@/lib/crypto'
import { sendConfiguredEmail } from '@/lib/smtp'
import type { StoreUser } from '@/lib/auth'

export type EmailVerificationPurpose = 'account_email' | 'identity_public_email' | 'identity_private_email'

const CODE_TTL_MINUTES = 10
const CODE_TTL_MS = CODE_TTL_MINUTES * 60 * 1000

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function hashCode(purpose: EmailVerificationPurpose, email: string, code: string) {
  return hmac(`${purpose}:${normalizeEmail(email)}:${code}`)
}

export function generateEmailCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
}

export async function sendEmailVerificationCode(user: Pick<StoreUser, 'id' | 'display_name' | 'email' | 'wallet_address'>, purpose: EmailVerificationPurpose, email: string) {
  const normalizedEmail = normalizeEmail(email)
  const code = generateEmailCode()
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString()
  const supabase = createAdminClient()

  const { error } = await supabase.from('email_verification_codes').insert({
    user_id: user.id,
    purpose,
    email: normalizedEmail,
    code_hash: hashCode(purpose, normalizedEmail, code),
    expires_at: expiresAt
  })
  if (error) throw error

  await sendConfiguredEmail('verification_code', normalizedEmail, {
    name: user.display_name ?? user.email ?? user.wallet_address ?? 'MXStore 用户',
    code,
    expiresMinutes: CODE_TTL_MINUTES
  })

  return { expiresAt }
}

export async function verifyEmailCode(userId: string, purpose: EmailVerificationPurpose, email: string, code: string) {
  const normalizedEmail = normalizeEmail(email)
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('email_verification_codes')
    .select('id,code_hash,expires_at,consumed_at')
    .eq('user_id', userId)
    .eq('purpose', purpose)
    .eq('email', normalizedEmail)
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('验证码不存在或已被使用')
  if (new Date(data.expires_at).getTime() < Date.now()) throw new Error('验证码已过期')
  if (data.code_hash !== hashCode(purpose, normalizedEmail, code.trim())) throw new Error('验证码不正确')

  const now = new Date().toISOString()
  const { error: consumeError } = await supabase
    .from('email_verification_codes')
    .update({ consumed_at: now })
    .eq('id', data.id)
  if (consumeError) throw consumeError

  const patch: Record<string, string> = { updated_at: now }
  if (purpose === 'account_email') {
    patch.email = normalizedEmail
    patch.email_verified_at = now
  }
  if (purpose === 'identity_public_email') {
    patch.identity_public_email = normalizedEmail
    patch.identity_public_email_verified_at = now
  }
  if (purpose === 'identity_private_email') {
    patch.identity_private_email = normalizedEmail
    patch.identity_private_email_verified_at = now
  }

  const { error: updateError } = await supabase
    .from('store_users')
    .update(patch)
    .eq('id', userId)
  if (updateError) throw updateError
}
