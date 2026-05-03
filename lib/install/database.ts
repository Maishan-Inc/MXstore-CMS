import 'server-only'
import { Client } from 'pg'

export async function checkDatabaseConnection(databaseUrl = process.env.SUPABASE_DB_URL) {
  if (!databaseUrl) {
    return { ok: false, message: '缺少 SUPABASE_DB_URL' }
  }

  const client = createDatabaseClient(databaseUrl)
  try {
    await client.connect()
    await client.query('select 1')
    return { ok: true, message: '数据库初始化连接可用' }
  } catch (error) {
    return { ok: false, message: `数据库初始化连接失败: ${toErrorMessage(error)}` }
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
