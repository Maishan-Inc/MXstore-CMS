import 'server-only'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unsealJson } from '@/lib/crypto'
import type { AccountType, EnterpriseCertificationStatus, TeamPlanStatus } from '@/lib/account'

export const WALLET_SESSION_COOKIE = 'store_wallet_session'

const STORE_USER_BASE_SELECT = 'id,role,email,display_name,wallet_address,auth_user_id'
const STORE_USER_EXTENDED_SELECT = `${STORE_USER_BASE_SELECT},avatar_url,avatar_source,account_type,developer_name,developer_avatar_url,organization_name,enterprise_certification_status,enterprise_certification_note,team_plan_status,download_quota_bytes,distribution_quota_bytes,distribution_charge_threshold_bytes`

export type StoreUser = {
  id: string
  role: 'user' | 'admin'
  email: string | null
  display_name: string | null
  wallet_address: string | null
  auth_user_id: string | null
  avatar_url: string | null
  avatar_source: 'none' | 'oauth' | 'custom'
  account_type: AccountType
  developer_name: string | null
  developer_avatar_url: string | null
  organization_name: string | null
  enterprise_certification_status: EnterpriseCertificationStatus
  enterprise_certification_note: string | null
  team_plan_status: TeamPlanStatus
  download_quota_bytes: number
  distribution_quota_bytes: number
  distribution_charge_threshold_bytes: number
}

type WalletSession = {
  userId: string
  address: string
  issuedAt: number
}

type StoreUserRow = Partial<Omit<StoreUser, 'id' | 'role'>> & {
  id: string
  role: 'user' | 'admin'
  avatar_url?: string | null
  avatar_source?: 'none' | 'oauth' | 'custom' | null
}

type StoreUserLookupColumn = 'id' | 'auth_user_id' | 'wallet_address'

type StoreUserUpsertPayload = {
  auth_user_id?: string
  email?: string | null
  display_name?: string | null
  wallet_address?: string
}

function normalizeStoreUser(row: StoreUserRow | null): StoreUser | null {
  if (!row) return null
  return {
    id: row.id,
    role: row.role,
    email: row.email ?? null,
    display_name: row.display_name ?? null,
    wallet_address: row.wallet_address ?? null,
    auth_user_id: row.auth_user_id ?? null,
    avatar_url: row.avatar_url ?? null,
    avatar_source: row.avatar_source ?? 'none',
    account_type: row.account_type ?? 'unselected',
    developer_name: row.developer_name ?? null,
    developer_avatar_url: row.developer_avatar_url ?? null,
    organization_name: row.organization_name ?? null,
    enterprise_certification_status: row.enterprise_certification_status ?? 'not_required',
    enterprise_certification_note: row.enterprise_certification_note ?? null,
    team_plan_status: row.team_plan_status ?? 'none',
    download_quota_bytes: Number(row.download_quota_bytes ?? 0),
    distribution_quota_bytes: Number(row.distribution_quota_bytes ?? 0),
    distribution_charge_threshold_bytes: Number(row.distribution_charge_threshold_bytes ?? 1073741824)
  }
}

function isMissingStoreUserProfileColumn(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? ''
  return [
    'avatar_url',
    'avatar_source',
    'account_type',
    'developer_name',
    'developer_avatar_url',
    'organization_name',
    'enterprise_certification_status',
    'enterprise_certification_note',
    'team_plan_status',
    'download_quota_bytes',
    'distribution_quota_bytes',
    'distribution_charge_threshold_bytes'
  ].some((column) => message.includes(column))
}

export async function loadStoreUserBy(
  admin: ReturnType<typeof createAdminClient>,
  column: StoreUserLookupColumn,
  value: string
): Promise<StoreUser | null> {
  const extended = await admin
    .from('store_users')
    .select(STORE_USER_EXTENDED_SELECT)
    .eq(column, value)
    .maybeSingle()
  if (!extended.error) return normalizeStoreUser(extended.data as StoreUserRow | null)
  if (!isMissingStoreUserProfileColumn(extended.error)) throw extended.error

  const { data, error } = await admin
    .from('store_users')
    .select(STORE_USER_BASE_SELECT)
    .eq(column, value)
    .maybeSingle()
  if (error) throw error
  return normalizeStoreUser(data as StoreUserRow | null)
}

export async function upsertStoreUserProfile(
  admin: ReturnType<typeof createAdminClient>,
  payload: StoreUserUpsertPayload,
  options: {
    onConflict: 'auth_user_id' | 'wallet_address'
    lookupColumn: StoreUserLookupColumn
    lookupValue: string
  }
): Promise<StoreUser | null> {
  const { error } = await admin
    .from('store_users')
    .upsert(payload, { onConflict: options.onConflict })
  if (error) throw error

  return loadStoreUserBy(admin, options.lookupColumn, options.lookupValue)
}

export async function getCurrentStoreUser(): Promise<StoreUser | null> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: authData } = await supabase.auth.getUser()

  if (authData.user) {
    return upsertStoreUserProfile(admin, {
      auth_user_id: authData.user.id,
      email: authData.user.email ?? null,
      display_name: authData.user.user_metadata?.name ?? authData.user.email ?? null
    }, {
      onConflict: 'auth_user_id',
      lookupColumn: 'auth_user_id',
      lookupValue: authData.user.id
    })
  }

  const cookieStore = await cookies()
  const walletSession = unsealJson<WalletSession>(cookieStore.get(WALLET_SESSION_COOKIE)?.value)
  if (!walletSession?.userId) return null

  return loadStoreUserBy(admin, 'id', walletSession.userId)
}

export async function requireUser() {
  const user = await getCurrentStoreUser()
  if (!user) throw new Response('Unauthorized', { status: 401 })
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== 'admin') throw new Response('Forbidden', { status: 403 })
  return user
}
