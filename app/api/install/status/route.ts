import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseOk = !!supabaseUrl && !!supabaseKey

  if (!supabaseOk) {
    return NextResponse.json({
      installed: false,
      has_admin: false,
      checks: [
        { name: 'Supabase 连接', status: 'error', message: '缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY' },
        { name: '数据库表', status: 'pending', message: '等待 Supabase 配置' },
        { name: '管理员账号', status: 'pending', message: '尚未创建' }
      ]
    })
  }

  // Dynamic import to avoid crash when env vars are missing
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  let installed = false
  try {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'installed')
      .maybeSingle()
    installed = data?.value === 'true'
  } catch {
    installed = false
  }

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

  return NextResponse.json({
    installed,
    has_admin: hasAdmin,
    checks: [
      { name: 'Supabase 连接', status: 'ok', message: '环境变量已配置' },
      { name: '数据库表', status: 'ok', message: '连接后自动创建' },
      { name: '管理员账号', status: hasAdmin ? 'ok' : 'pending', message: hasAdmin ? '已存在管理员' : '尚未创建' }
    ]
  })
}
