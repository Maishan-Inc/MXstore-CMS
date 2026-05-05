import { afterEach, describe, expect, test, vi } from 'vitest'
import type { NextRequest } from 'next/server'

type MockStoreUser = {
  id: string
  role: 'admin' | 'user'
  account_type?: 'unselected' | 'personal'
  enterprise_certification_status?: 'not_required'
  team_plan_status?: 'none'
}

type MockAuthUser = {
  id: string
  email?: string
  user_metadata?: {
    name?: string
  }
}

type MockAuthError = {
  message: string
}

type MockSignInResult = {
  data: { user: MockAuthUser | null }
  error: MockAuthError | null
}

function createMockSupabase({
  signInResults = [{
    data: { user: { id: 'auth-user-1', email: 'user@example.com' } },
    error: null
  }],
  createUserResult = { data: { user: { id: 'auth-created' } }, error: null },
  storeUser = {
    id: 'store-user-1',
    role: 'user',
    account_type: 'personal',
    enterprise_certification_status: 'not_required',
    team_plan_status: 'none'
  },
  profileResults
}: {
  signInResults?: MockSignInResult[]
  createUserResult?: { data: { user: { id: string } | null }; error: MockAuthError | null }
  storeUser?: MockStoreUser
  profileResults?: { data: MockStoreUser | null; error: MockAuthError | null }[]
} = {}) {
  const signInWithPassword = vi.fn()
  signInResults.forEach((result) => {
    signInWithPassword.mockResolvedValueOnce(result)
  })

  const createUser = vi.fn().mockResolvedValue(createUserResult)
  const maybeSingle = vi.fn()
  const results = profileResults ?? [{ data: storeUser, error: null }]
  results.forEach((result) => {
    maybeSingle.mockResolvedValueOnce(result)
  })
  maybeSingle.mockResolvedValue({ data: storeUser, error: null })
  const eq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq, maybeSingle }))
  const upsert = vi.fn().mockResolvedValue({ error: null })
  const from = vi.fn(() => ({ upsert, select }))

  return {
    auth: {
      signInWithPassword,
      admin: {
        createUser
      }
    },
    from,
    mocks: {
      createUser,
      from,
      upsert,
      select,
      eq,
      maybeSingle
    }
  }
}

async function postPasswordLogin(body: unknown, supabase = createMockSupabase()) {
  vi.resetModules()
  vi.doMock('@/lib/supabase/route', () => ({
    createRouteClient: vi.fn().mockReturnValue({
      supabase,
      applyAuthCookies: (response: Response) => {
        response.headers.append('set-cookie', 'sb-test-auth-token=session; Path=/; HttpOnly')
        return response
      }
    })
  }))
  vi.doMock('@/lib/supabase/admin', () => ({
    createAdminClient: vi.fn().mockReturnValue(supabase)
  }))

  const { POST } = await import('@/app/auth/password/route')
  return POST(new Request('https://mxstore.test/auth/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }) as NextRequest)
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('password login route', () => {
  test('rejects invalid email and password input', async () => {
    const response = await postPasswordLogin({ email: 'bad-email', password: 'short' })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: '请输入有效的邮箱和至少 8 位密码'
    })
  })

  test('signs in with Supabase password auth and redirects users to dashboard', async () => {
    const supabase = createMockSupabase()
    const response = await postPasswordLogin({ email: 'USER@Example.com', password: 'admin1234' }, supabase)

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'admin1234'
    })
    expect(supabase.mocks.createUser).not.toHaveBeenCalled()
    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toContain('sb-test-auth-token=session')
    await expect(response.json()).resolves.toEqual({ ok: true, next: '/dashboard' })
  })

  test('auto-registers missing password users before redirecting', async () => {
    const supabase = createMockSupabase({
      signInResults: [
        { data: { user: null }, error: { message: 'Invalid login credentials' } },
        { data: { user: { id: 'auth-created', email: 'new@example.com' } }, error: null }
      ]
    })
    const response = await postPasswordLogin({ email: 'new@example.com', password: 'newpass123' }, supabase)

    expect(supabase.mocks.createUser).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'newpass123',
      email_confirm: true
    })
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(2)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, next: '/dashboard' })
  })

  test('redirects admin password users to admin console', async () => {
    const response = await postPasswordLogin(
      { email: 'admin@example.com', password: 'admin1234' },
      createMockSupabase({ storeUser: { id: 'store-admin-1', role: 'admin' } })
    )

    await expect(response.json()).resolves.toEqual({ ok: true, next: '/admin' })
  })

  test('falls back to base profile columns when upgraded account columns are missing', async () => {
    const response = await postPasswordLogin(
      { email: 'admin@example.com', password: 'admin1234' },
      createMockSupabase({
        profileResults: [
          { data: null, error: { message: "column store_users.account_type does not exist" } },
          { data: { id: 'store-admin-1', role: 'admin' }, error: null }
        ]
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, next: '/admin' })
  })

  test('returns a safe error when credentials belong to an existing account', async () => {
    const response = await postPasswordLogin(
      { email: 'user@example.com', password: 'wrongpass' },
      createMockSupabase({
        signInResults: [
          { data: { user: null }, error: { message: 'Invalid login credentials' } }
        ],
        createUserResult: {
          data: { user: null },
          error: { message: 'A user with this email address has already been registered' }
        }
      })
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ ok: false, error: '邮箱或密码不正确' })
  })
})
