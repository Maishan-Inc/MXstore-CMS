import { afterEach, describe, expect, test, vi } from 'vitest'

const originalEnv = { ...process.env }

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
  process.env = { ...originalEnv }
})

describe('install database connection check', () => {
  test('reports malformed database urls without throwing', async () => {
    vi.doMock('pg', () => ({
      Client: class {
        constructor() {
          throw new Error('invalid connection string')
        }
      }
    }))

    const { checkDatabaseConnection } = await import('@/lib/install/database')

    await expect(checkDatabaseConnection('not-a-postgres-url')).resolves.toEqual({
      ok: false,
      message: '数据库初始化连接失败: invalid connection string'
    })
  })
})
