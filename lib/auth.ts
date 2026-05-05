import 'server-only'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unsealJson } from '@/lib/crypto'

export const WALLET_SESSION_COOKIE = 'store_wallet_session'

export type StoreUser = {
  id: string
  role: 'user' | 'admin'
  email: string | null
  wallet_address: string | null
  auth_user_id: string | null
  avatar_url: string | null
  avatar_source: 'none' | 'oauth' | 'custom'
}

type WalletSession = {
  userId: string
  address: string
  issuedAt: number
}

export async function getCurrentStoreUser(): Promise<StoreUser | null> {
  const supabase = await createClient()
  const admin = createAdminClient()
  const { data: authData } = await supabase.auth.getUser()

  if (authData.user) {
    const { data, error } = await admin
      .from('store_users')
      .upsert(
        {
          auth_user_id: authData.user.id,
          email: authData.user.email ?? null,
          display_name: authData.user.user_metadata?.name ?? authData.user.email ?? null
        },
        { onConflict: 'auth_user_id' }
      )
      .select('id,role,email,wallet_address,auth_user_id,avatar_url,avatar_source')
      .single()
    if (error) throw error
    return data as StoreUser
  }

  const cookieStore = await cookies()
  const walletSession = unsealJson<WalletSession>(cookieStore.get(WALLET_SESSION_COOKIE)?.value)
  if (!walletSession?.userId) return null

  const { data, error } = await admin
    .from('store_users')
    .select('id,role,email,wallet_address,auth_user_id,avatar_url,avatar_source')
    .eq('id', walletSession.userId)
    .maybeSingle()
  if (error) throw error
  return data as StoreUser | null
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
