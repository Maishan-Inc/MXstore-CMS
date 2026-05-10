import 'server-only'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { createDatabaseClient, safeEnd, toErrorMessage } from '@/lib/install/database'

type Migration = {
  filename: string
  readSql: () => Promise<string>
}

export type MigrationResult = {
  applied: string[]
  skipped: string[]
}

const migrations: Migration[] = [
  {
    filename: '0001_schema.sql',
    readSql: () => readFile(new URL('../../supabase/migrations/0001_schema.sql', import.meta.url), 'utf8')
  },
  {
    filename: '0002_atomic_deduction.sql',
    readSql: () => readFile(new URL('../../supabase/migrations/0002_atomic_deduction.sql', import.meta.url), 'utf8')
  },
  {
    filename: '0003_system_settings.sql',
    readSql: () => readFile(new URL('../../supabase/migrations/0003_system_settings.sql', import.meta.url), 'utf8')
  },
  {
    filename: '0004_store_content_management.sql',
    readSql: () => readFile(new URL('../../supabase/migrations/0004_store_content_management.sql', import.meta.url), 'utf8')
  },
  {
    filename: '0005_user_avatar.sql',
    readSql: () => readFile(new URL('../../supabase/migrations/0005_user_avatar.sql', import.meta.url), 'utf8')
  },
  {
    filename: '0006_account_identity_publish_traffic.sql',
    readSql: () => readFile(new URL('../../supabase/migrations/0006_account_identity_publish_traffic.sql', import.meta.url), 'utf8')
  },
  {
    filename: '0007_app_detail_content.sql',
    readSql: () => readFile(new URL('../../supabase/migrations/0007_app_detail_content.sql', import.meta.url), 'utf8')
  },
  {
    filename: '0008_footer_settings.sql',
    readSql: () => readFile(new URL('../../supabase/migrations/0008_footer_settings.sql', import.meta.url), 'utf8')
  },
  {
    filename: '0009_package_marketing_fields.sql',
    readSql: () => readFile(new URL('../../supabase/migrations/0009_package_marketing_fields.sql', import.meta.url), 'utf8')
  },
  {
    filename: '0010_account_identity_membership.sql',
    readSql: () => readFile(new URL('../../supabase/migrations/0010_account_identity_membership.sql', import.meta.url), 'utf8')
  }
]

const lockKey = 9_457_301_042

export async function applyInstallMigrations(databaseUrl = process.env.SUPABASE_DB_URL): Promise<MigrationResult> {
  if (!databaseUrl) {
    throw new Error('缺少 SUPABASE_DB_URL，无法自动初始化数据库')
  }

  const client = createDatabaseClient(databaseUrl)
  const result: MigrationResult = { applied: [], skipped: [] }
  let locked = false

  try {
    await client.connect()
    await client.query('select pg_advisory_lock($1)', [lockKey])
    locked = true

    await client.query(`
      create table if not exists public.mxstore_schema_migrations (
        filename text primary key,
        checksum text not null,
        applied_at timestamptz not null default now()
      )
    `)

    for (const migration of migrations) {
      const sql = await migration.readSql()
      const checksum = createHash('sha256').update(sql).digest('hex')
      const existing = await client.query<{ checksum: string }>(
        'select checksum from public.mxstore_schema_migrations where filename = $1',
        [migration.filename]
      )

      if (existing.rowCount) {
        if (existing.rows[0].checksum !== checksum) {
          throw new Error(`迁移文件 ${migration.filename} 已执行，但当前内容校验不一致`)
        }
        result.skipped.push(migration.filename)
        continue
      }

      await client.query('begin')
      try {
        await client.query(sql)
        await client.query(
          'insert into public.mxstore_schema_migrations (filename, checksum) values ($1, $2)',
          [migration.filename, checksum]
        )
        await client.query('commit')
        result.applied.push(migration.filename)
      } catch (error) {
        await client.query('rollback')
        throw error
      }
    }

    return result
  } catch (error) {
    throw new Error(`数据库初始化失败: ${toErrorMessage(error)}`)
  } finally {
    if (locked) {
      try {
        await client.query('select pg_advisory_unlock($1)', [lockKey])
      } catch {
        // ignore unlock errors during cleanup
      }
    }
    await safeEnd(client)
  }
}
