import 'server-only'
import { Client } from 'pg'

type InstallRecordsInput = {
  authUserId: string
  email: string
  displayName: string
  siteName: string
  siteDomain: string
  installedAt: string
}

export async function checkDatabaseConnection(databaseUrl = process.env.SUPABASE_DB_URL) {
  if (!databaseUrl) {
    return { ok: false, message: '缺少 SUPABASE_DB_URL' }
  }

  let client: Client | null = null
  try {
    client = createDatabaseClient(databaseUrl)
    await client.connect()
    await client.query('select 1')
    return { ok: true, message: '数据库初始化连接可用' }
  } catch (error) {
    return { ok: false, message: `数据库初始化连接失败: ${toErrorMessage(error)}` }
  } finally {
    if (client) {
      await safeEnd(client)
    }
  }
}

export async function readInstalledSetting(databaseUrl = process.env.SUPABASE_DB_URL) {
  if (!databaseUrl) {
    throw new Error('缺少 SUPABASE_DB_URL，无法读取安装状态')
  }

  const client = createDatabaseClient(databaseUrl)
  try {
    await client.connect()
    const result = await client.query<{ value: string }>('select value from public.system_settings where key = $1', ['installed'])
    return result.rows[0]?.value === 'true'
  } finally {
    await safeEnd(client)
  }
}

export async function writeInstallRecords(input: InstallRecordsInput, databaseUrl = process.env.SUPABASE_DB_URL) {
  if (!databaseUrl) {
    throw new Error('缺少 SUPABASE_DB_URL，无法写入安装数据')
  }

  const client = createDatabaseClient(databaseUrl)
  try {
    await client.connect()
    await client.query('begin')
    try {
      await client.query(
        `
          insert into public.store_users (auth_user_id, email, display_name, role)
          values ($1, $2, $3, 'admin')
          on conflict (auth_user_id) do update set
            email = excluded.email,
            display_name = excluded.display_name,
            role = excluded.role,
            updated_at = now()
        `,
        [input.authUserId, input.email, input.displayName]
      )

      const settings = [
        { key: 'installed', value: 'true', groupName: 'system' },
        { key: 'site_name', value: input.siteName, groupName: 'site' },
        { key: 'site_domain', value: input.siteDomain, groupName: 'site' },
        { key: 'installed_at', value: input.installedAt, groupName: 'system' }
      ]

      for (const setting of settings) {
        await client.query(
          `
            insert into public.system_settings (key, value, group_name)
            values ($1, $2, $3)
            on conflict (key) do update set
              value = excluded.value,
              group_name = excluded.group_name,
              updated_at = now()
          `,
          [setting.key, setting.value, setting.groupName]
        )
      }

      await client.query('commit')
    } catch (error) {
      await client.query('rollback')
      throw error
    }
  } finally {
    await safeEnd(client)
  }
}

export function createDatabaseClient(databaseUrl: string) {
  return new Client({ connectionString: databaseUrl, ssl: sslConfig(databaseUrl) })
}

export function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '未知错误'
}

export async function safeEnd(client: Client) {
  try {
    await client.end()
  } catch {
    return
  }
}

function sslConfig(databaseUrl: string) {
  if (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
    return undefined
  }

  return { rejectUnauthorized: false }
}
