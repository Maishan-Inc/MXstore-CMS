import { afterEach, describe, expect, test, vi } from 'vitest'

const originalEnv = { ...process.env }

type MockSupabaseOptions = {
  authError?: { message: string } | null
  missingTables?: boolean
  installed?: boolean
  adminCount?: number
}

function createMockSupabase(options: MockSupabaseOptions = {}) {
  const authError = options.authError ?? null
  const missingTables = options.missingTables ?? false
  const installed = options.installed ?? false
  const adminCount = options.adminCount ?? 0

  return {
    auth: {
      admin: {
        listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: authError })
      }
    },
    from: vi.fn((table: string) => ({
      select: vi.fn((_columns?: string, selectOptions?: { count?: string; head?: boolean }) => {
        if (table === 'system_settings') {
          return {
            limit: vi.fn().mockResolvedValue({ error: missingTables ? { message: 'relation does not exist' } : null }),
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: missingTables ? null : { value: installed ? 'true' : 'false' },
                error: missingTables ? { message: 'relation does not exist' } : null
              })
            })
          }
        }

        if (table === 'store_users' && selectOptions?.count === 'exact' && selectOptions.head) {
          return {
            eq: vi.fn().mockResolvedValue({
              count: missingTables ? null : adminCount,
              error: missingTables ? { message: 'relation does not exist' } : null
            })
          }
        }

        return {}
      })
    }))
  }
}

async function getStatusWithSupabase(mockSupabase: ReturnType<typeof createMockSupabase>) {
  vi.resetModules()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
  delete process.env.NEXT_PUBLIC_APP_URL
  delete process.env.NEXT_PUBLIC_SITE_URL

  vi.doMock('@/lib/supabase/admin', () => ({
    createAdminClient: () => mockSupabase
  }))

  const { GET } = await import('@/app/api/install/status/route')
  const response = await GET()
  return response.json()
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
  process.env = { ...originalEnv }
})

describe('install status', () => {
  test('does not block the install wizard when business tables are missing', async () => {
    const data = await getStatusWithSupabase(createMockSupabase({ missingTables: true }))

    expect(data.installed).toBe(false)
    expect(data.has_admin).toBe(false)
    expect(data.checks).toContainEqual(expect.objectContaining({
      name: 'Supabase 连接',
      status: 'ok'
    }))
    expect(data.checks).not.toContainEqual(expect.objectContaining({
      name: '环境变量'
    }))
    expect(data.checks).toContainEqual(expect.objectContaining({
      name: '数据库表完整性',
      status: 'ok'
    }))
    expect(data.checks).toContainEqual(expect.objectContaining({
      name: '安装状态',
      status: 'ok'
    }))
    expect(data.checks).toContainEqual(expect.objectContaining({
      name: '管理员账户',
      status: 'ok'
    }))
  })

  test('reports a Supabase connection error when the service role key cannot call Supabase', async () => {
    const data = await getStatusWithSupabase(createMockSupabase({ authError: { message: 'Invalid API key' } }))

    expect(data.checks).toContainEqual(expect.objectContaining({
      name: 'Supabase 连接',
      status: 'error'
    }))
    expect(data.checks).toContainEqual(expect.objectContaining({
      name: '安装状态',
      status: 'ok'
    }))
    expect(data.checks).toContainEqual(expect.objectContaining({
      name: '管理员账户',
      status: 'ok'
    }))
  })
})
