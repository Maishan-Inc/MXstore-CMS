import { createHash } from 'node:crypto'
import { afterEach, describe, expect, test, vi } from 'vitest'

const originalEnv = { ...process.env }
const sqlFiles: Record<string, string> = {
  '0001_schema.sql': 'create table if not exists public.store_users (id uuid);',
  '0002_atomic_deduction.sql': 'create or replace function public.test_fn() returns void language plpgsql as $$ begin null; end; $$;',
  '0003_system_settings.sql': 'create table if not exists public.system_settings (key text primary key);',
  '0004_store_content_management.sql': 'create table if not exists public.app_categories (id uuid);',
  '0005_user_avatar.sql': 'alter table public.store_users add column if not exists avatar_url text;'
}

type QueryCall = { text: string; params?: unknown[] }

type SetupOptions = {
  existing?: Record<string, string>
  failOn?: string
}

async function setup(options: SetupOptions = {}) {
  vi.resetModules()
  process.env.SUPABASE_DB_URL = 'postgresql://user:pass@example.com:6543/postgres'

  const existing = new Map(Object.entries(options.existing ?? {}))
  const queries: QueryCall[] = []
  const end = vi.fn().mockResolvedValue(undefined)

  class MockClient {
    connect = vi.fn().mockResolvedValue(undefined)
    end = end
    query = vi.fn(async (text: string, params?: unknown[]) => {
      queries.push({ text, params })

      if (options.failOn && text.includes(options.failOn)) {
        throw new Error('sql failed')
      }

      if (text.includes('select checksum from public.mxstore_schema_migrations')) {
        const filename = String(params?.[0])
        const checksum = existing.get(filename)
        return { rowCount: checksum ? 1 : 0, rows: checksum ? [{ checksum }] : [] }
      }

      if (text.includes('insert into public.mxstore_schema_migrations')) {
        existing.set(String(params?.[0]), String(params?.[1]))
      }

      return { rowCount: 0, rows: [] }
    })
  }

  vi.doMock('node:fs/promises', () => ({
    readFile: vi.fn(async (filePath: URL) => {
      const filename = filePath.pathname.split(/[\\/]/).pop() ?? ''
      return sqlFiles[filename]
    })
  }))
  vi.doMock('pg', () => ({ Client: MockClient }))

  const module = await import('@/lib/install/migrations')
  return { ...module, queries, end }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.resetModules()
  process.env = { ...originalEnv }
})

describe('install migrations', () => {
  test('applies migration files in order without splitting SQL', async () => {
    const { applyInstallMigrations, queries } = await setup()

    const result = await applyInstallMigrations()

    expect(result.applied).toEqual([
      '0001_schema.sql',
      '0002_atomic_deduction.sql',
      '0003_system_settings.sql',
      '0004_store_content_management.sql',
      '0005_user_avatar.sql'
    ])
    const executedSql = queries.map((query) => query.text)
    const migrationIndexes = Object.values(sqlFiles).map((sql) => executedSql.indexOf(sql))
    expect(migrationIndexes.every((index) => index >= 0)).toBe(true)
    expect(migrationIndexes).toEqual([...migrationIndexes].sort((a, b) => a - b))
    expect(executedSql).toContain(sqlFiles['0002_atomic_deduction.sql'])
  })

  test('skips already applied migrations with matching checksums', async () => {
    const existing = Object.fromEntries(
      Object.entries(sqlFiles).map(([filename, sql]) => [filename, createHash('sha256').update(sql).digest('hex')])
    )
    const { applyInstallMigrations } = await setup({ existing })

    const result = await applyInstallMigrations()

    expect(result.applied).toEqual([])
    expect(result.skipped).toEqual([
      '0001_schema.sql',
      '0002_atomic_deduction.sql',
      '0003_system_settings.sql',
      '0004_store_content_management.sql',
      '0005_user_avatar.sql'
    ])
  })

  test('fails on checksum mismatch', async () => {
    const { applyInstallMigrations } = await setup({ existing: { '0001_schema.sql': 'old-checksum' } })

    await expect(applyInstallMigrations()).rejects.toThrow('校验不一致')
  })

  test('releases advisory lock when a migration fails', async () => {
    const { applyInstallMigrations, queries, end } = await setup({ failOn: 'public.test_fn' })

    await expect(applyInstallMigrations()).rejects.toThrow('数据库初始化失败')
    expect(queries.some((query) => query.text.includes('pg_advisory_unlock'))).toBe(true)
    expect(end).toHaveBeenCalled()
  })

  test('reports missing database url', async () => {
    const { applyInstallMigrations } = await setup()

    await expect(applyInstallMigrations('')).rejects.toThrow('缺少 SUPABASE_DB_URL')
  })
})
