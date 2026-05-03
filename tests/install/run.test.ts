import { afterEach, describe, expect, test, vi } from 'vitest'

const originalEnv = { ...process.env }

type MockOptions = {
  missingTables?: boolean
  existingEmail?: string
}

function createMockSupabase(options: MockOptions = {}) {
  const missingTables = options.missingTables ?? false
  const existingEmail = options.existingEmail?.toLowerCase() ?? ''
  const createUser = vi.fn()
  const updateUserById = vi.fn().mockResolvedValue({ data: null, error: null })
  const listUsers = vi.fn().mockResolvedValue({
    data: {
      users: existingEmail ? [{ id: 'auth-existing', email: existingEmail }] : []
    },
    error: null
  })
  const upsert = vi.fn().mockResolvedValue({ data: null, error: null })

  const makeTableChain = (table: string) => {
    const base = {
      select: vi.fn(() => ({
        limit: vi.fn().mockResolvedValue({ error: missingTables ? { message: `relation "${table}" does not exist` } : null }),
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: missingTables ? { message: `relation "${table}" does not exist` } : null
          })
        })
      })),
      upsert
    }

    return base
  }

  return {
    auth: {
      admin: {
        listUsers,
        createUser,
        updateUserById
      }
    },
    from: vi.fn((table: string) => makeTableChain(table))
  }
}

async function runInstallWithMock(mockSupabase: ReturnType<typeof createMockSupabase>, body: Record<string, string>) {
  vi.resetModules()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'

  vi.doMock('@/lib/supabase/admin', () => ({
    createAdminClient: () => mockSupabase
  }))

  const { POST } = await import('@/app/api/install/run/route')
  const request = new Request('http://localhost/api/install/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  return POST(request as never)
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
  process.env = { ...originalEnv }
})

describe('install run', () => {
  test('rejects installation before creating auth users when tables are missing', async () => {
    const mockSupabase = createMockSupabase({ missingTables: true })
    const response = await runInstallWithMock(mockSupabase, {
      admin_username: 'admin',
      admin_email: 'admin@example.com',
      admin_password: 'admin1234',
      site_name: 'MXStore',
      site_domain: 'https://example.com'
    })

    expect(response.status).toBe(409)
    await expect(response.text()).resolves.toContain('数据库表尚未创建')
    expect(mockSupabase.auth.admin.createUser).not.toHaveBeenCalled()
    expect(mockSupabase.auth.admin.updateUserById).not.toHaveBeenCalled()
  })

  test('reuses an existing auth user with the same email', async () => {
    const mockSupabase = createMockSupabase({ existingEmail: 'admin@example.com' })
    const response = await runInstallWithMock(mockSupabase, {
      admin_username: 'admin',
      admin_email: 'admin@example.com',
      admin_password: 'admin1234',
      site_name: 'MXStore',
      site_domain: 'https://example.com'
    })

    expect(response.ok).toBe(true)
    expect(mockSupabase.auth.admin.createUser).not.toHaveBeenCalled()
    expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith('auth-existing', {
      password: 'admin1234',
      email_confirm: true,
      user_metadata: { name: 'admin' }
    })
    expect(mockSupabase.from).toHaveBeenCalledWith('store_users')
    expect(mockSupabase.from).toHaveBeenCalledWith('system_settings')
  })
})
