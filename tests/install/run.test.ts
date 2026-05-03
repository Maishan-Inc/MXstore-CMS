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
}

type RunOptions = {
  dbUrl?: string
  migrationError?: Error
  installed?: boolean
  writeError?: Error
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

  return {
    auth: {
      admin: {
        listUsers,
        createUser,
        updateUserById
      }
    },
    from: vi.fn(() => {
      throw new Error('PostgREST schema cache should not be used during install')
    })
  }
}

async function runInstallWithMock(mockSupabase: ReturnType<typeof createMockSupabase>, options: RunOptions = {}) {
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

  const readInstalledSetting = vi.fn().mockResolvedValue(options.installed ?? false)
  const writeInstallRecords = vi.fn().mockResolvedValue(undefined)
  if (options.writeError) {
    writeInstallRecords.mockRejectedValue(options.writeError)
  }

  vi.doMock('@/lib/install/database', () => ({ readInstalledSetting, writeInstallRecords }))
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

  return {
    response: await POST(request as never),
    applyInstallMigrations,
    readInstalledSetting,
    writeInstallRecords
  }
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

  test('applies migrations and reads installed state before creating an auth user', async () => {
    const mockSupabase = createMockSupabase()
    const { response, applyInstallMigrations, readInstalledSetting } = await runInstallWithMock(mockSupabase)

    expect(response.ok).toBe(true)
    expect(applyInstallMigrations).toHaveBeenCalledBefore(readInstalledSetting)
    expect(readInstalledSetting).toHaveBeenCalledBefore(mockSupabase.auth.admin.createUser)
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

  test('does not depend on PostgREST schema cache after migrations', async () => {
    const mockSupabase = createMockSupabase()
    const { response, writeInstallRecords } = await runInstallWithMock(mockSupabase)

    expect(response.ok).toBe(true)
    expect(mockSupabase.from).not.toHaveBeenCalled()
    expect(writeInstallRecords).toHaveBeenCalledWith(expect.objectContaining({
      authUserId: 'auth-created',
      email: 'admin@example.com',
      displayName: 'admin',
      siteName: 'MXStore',
      siteDomain: 'https://example.com'
    }))
  })

  test('reuses an existing auth user with the same email', async () => {
    const mockSupabase = createMockSupabase({ existingEmail: 'admin@example.com' })
    const { response, writeInstallRecords } = await runInstallWithMock(mockSupabase)

    expect(response.ok).toBe(true)
    expect(mockSupabase.auth.admin.createUser).not.toHaveBeenCalled()
    expect(mockSupabase.auth.admin.updateUserById).toHaveBeenCalledWith('auth-existing', {
      password: 'admin1234',
      email_confirm: true,
      user_metadata: { name: 'admin' }
    })
    expect(writeInstallRecords).toHaveBeenCalledWith(expect.objectContaining({ authUserId: 'auth-existing' }))
  })

  test('rejects repeat installation after migrations are available', async () => {
    const mockSupabase = createMockSupabase()
    const { response } = await runInstallWithMock(mockSupabase, { installed: true })

    expect(response.status).toBe(409)
    await expect(response.text()).resolves.toContain('系统已安装')
    expect(mockSupabase.auth.admin.createUser).not.toHaveBeenCalled()
  })

  test('does not report success when install record writes fail', async () => {
    const mockSupabase = createMockSupabase()
    const { response, writeInstallRecords } = await runInstallWithMock(mockSupabase, { writeError: new Error('profile failed') })

    expect(response.status).toBe(500)
    await expect(response.text()).resolves.toContain('写入安装数据失败')
    expect(writeInstallRecords).toHaveBeenCalled()
  })
})
