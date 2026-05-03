import { afterEach, describe, expect, test, vi } from 'vitest'

const originalEnv = { ...process.env }
const validBody = {
  admin_username: 'admin',
  admin_email: 'admin@example.com',
  admin_password: 'admin1234',
  site_name: 'MXStore',
  site_domain: 'https://example.com'
}

type MockOptions = {
  existingEmail?: string
  installed?: boolean
  profileError?: { message: string } | null
}

function createMockSupabase(options: MockOptions = {}) {
  const existingEmail = options.existingEmail?.toLowerCase() ?? ''
  const createUser = vi.fn().mockResolvedValue({ data: { user: { id: 'auth-created' } }, error: null })
  const updateUserById = vi.fn().mockResolvedValue({ data: null, error: null })
  const listUsers = vi.fn().mockResolvedValue({
    data: {
      users: existingEmail ? [{ id: 'auth-existing', email: existingEmail }] : []
    },
    error: null
  })
  const tableUpserts: Record<string, ReturnType<typeof vi.fn>> = {}

  return {
    auth: {
      admin: {
        listUsers,
        createUser,
        updateUserById
      }
    },
    from: vi.fn((table: string) => {
      tableUpserts[table] ??= vi.fn().mockResolvedValue({
        data: null,
        error: table === 'store_users' ? options.profileError ?? null : null
      })

      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: table === 'system_settings' && options.installed ? { value: 'true' } : null,
              error: null
            })
          })
        })),
        upsert: tableUpserts[table]
      }
    })
  }
}

async function runInstallWithMock(
  mockSupabase: ReturnType<typeof createMockSupabase>,
  options: { dbUrl?: string; migrationError?: Error } = {}
) {
  vi.resetModules()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
  if (options.dbUrl !== undefined) {
    process.env.SUPABASE_DB_URL = options.dbUrl
  } else {
    process.env.SUPABASE_DB_URL = 'postgresql://user:pass@example.com:6543/postgres'
  }

  const applyInstallMigrations = vi.fn().mockResolvedValue({ applied: ['0001_schema.sql'], skipped: ['0002_atomic_deduction.sql', '0003_system_settings.sql'] })
  if (options.migrationError) {
    applyInstallMigrations.mockRejectedValue(options.migrationError)
  }

  vi.doMock('@/lib/install/migrations', () => ({ applyInstallMigrations }))
  vi.doMock('@/lib/supabase/admin', () => ({
    createAdminClient: () => mockSupabase
  }))

  const { POST } = await import('@/app/api/install/run/route')
  const request = new Request('http://localhost/api/install/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validBody)
  })

  return { response: await POST(request as never), applyInstallMigrations }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
  process.env = { ...originalEnv }
})

describe('install run', () => {
  test('requires SUPABASE_DB_URL before installing', async () => {
    const mockSupabase = createMockSupabase()
    const { response, applyInstallMigrations } = await runInstallWithMock(mockSupabase, { dbUrl: '' })

    expect(response.status).toBe(500)
    await expect(response.text()).resolves.toContain('缺少 SUPABASE_DB_URL')
    expect(applyInstallMigrations).not.toHaveBeenCalled()
    expect(mockSupabase.auth.admin.createUser).not.toHaveBeenCalled()
  })

  test('applies migrations before creating an auth user', async () => {
    const mockSupabase = createMockSupabase()
    const { response, applyInstallMigrations } = await runInstallWithMock(mockSupabase)

    expect(response.ok).toBe(true)
    expect(applyInstallMigrations).toHaveBeenCalledBefore(mockSupabase.auth.admin.createUser)
    expect(mockSupabase.auth.admin.createUser).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'admin1234',
      email_confirm: true,
      user_metadata: { name: 'admin' }
    })
  })

  test('does not create an auth user when migrations fail', async () => {
    const mockSupabase = createMockSupabase()
    const { response } = await runInstallWithMock(mockSupabase, { migrationError: new Error('数据库初始化失败: bad sql') })

    expect(response.status).toBe(500)
    await expect(response.text()).resolves.toContain('数据库初始化失败')
    expect(mockSupabase.auth.admin.createUser).not.toHaveBeenCalled()
  })

  test('reuses an existing auth user with the same email', async () => {
    const mockSupabase = createMockSupabase({ existingEmail: 'admin@example.com' })
    const { response } = await runInstallWithMock(mockSupabase)

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

  test('rejects repeat installation after migrations are available', async () => {
    const mockSupabase = createMockSupabase({ installed: true })
    const { response } = await runInstallWithMock(mockSupabase)

    expect(response.status).toBe(409)
    await expect(response.text()).resolves.toContain('系统已安装')
    expect(mockSupabase.auth.admin.createUser).not.toHaveBeenCalled()
  })

  test('does not mark installed when admin profile creation fails', async () => {
    const mockSupabase = createMockSupabase({ profileError: { message: 'profile failed' } })
    const { response } = await runInstallWithMock(mockSupabase)

    expect(response.status).toBe(500)
    await expect(response.text()).resolves.toContain('设置管理员角色失败')
    const upsertCalls = mockSupabase.from('system_settings').upsert.mock.calls
    expect(upsertCalls).toHaveLength(0)
  })
})
