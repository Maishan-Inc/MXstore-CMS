import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = createAdminClient()

  // Check if system_settings table exists and has installed=true
  let installed = false
  try {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'installed')
      .maybeSingle()
    installed = data?.value === 'true'
  } catch {
    // Table might not exist yet - that's fine, not installed
    installed = false
  }

  // Check if any admin user exists
  let hasAdmin = false
  try {
    const { count } = await supabase
      .from('store_users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
    hasAdmin = (count ?? 0) > 0
  } catch {
    hasAdmin = false
  }

  // Check Supabase connection
  const supabaseOk = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY

  return NextResponse.json({
    installed,
    has_admin: hasAdmin,
    checks: [
      { name: 'Supabase 连接', status: supabaseOk ? 'ok' : 'error', message: supabaseOk ? '环境变量已配置' : '缺少 SUPABASE_URL 或 SERVICE_ROLE_KEY' },
      { name: '数据库表', status: 'ok', message: '连接后自动创建' },
      { name: '管理员账号', status: hasAdmin ? 'ok' : 'pending', message: hasAdmin ? '已存在管理员' : '尚未创建' }
    ]
  })
}
