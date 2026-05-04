import { afterEach, describe, expect, test, vi } from 'vitest'
import type { NextRequest } from 'next/server'

type MockStoreUser = {
  role: 'admin' | 'user'
}

function createMockSupabase(storeUser: MockStoreUser | null, authError: { message: string } | null = null) {
  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: authError ? { user: null } : { user: { id: 'auth-user-1' } },
        error: authError
      })
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: storeUser, error: null })
        }))
      }))
    }))
  }
}

async function postPasswordLogin(body: unknown, supabase = createMockSupabase({ role: 'user' })) {
  vi.resetModules()
  vi.doMock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue(supabase)
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
    const supabase = createMockSupabase({ role: 'user' })
    const response = await postPasswordLogin({ email: 'USER@Example.com', password: 'admin1234' }, supabase)

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'admin1234'
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, next: '/dashboard' })
  })

  test('redirects admin password users to admin console', async () => {
    const response = await postPasswordLogin(
      { email: 'admin@example.com', password: 'admin1234' },
      createMockSupabase({ role: 'admin' })
    )

    await expect(response.json()).resolves.toEqual({ ok: true, next: '/admin' })
  })

  test('returns a safe error when Supabase rejects credentials', async () => {
    const response = await postPasswordLogin(
      { email: 'user@example.com', password: 'wrongpass' },
      createMockSupabase(null, { message: 'Invalid login credentials' })
    )

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ ok: false, error: '邮箱或密码不正确' })
  })
})
