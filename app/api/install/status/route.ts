import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseOk = !!supabaseUrl && !!supabaseKey

  const checks: Array<{ name: string; status: string; message: string }> = []

  // 1. Supabase 连接
  if (!supabaseOk) {
    checks.push({ name: 'Supabase 连接', status: 'error', message: '缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY' })
  } else {
    checks.push({ name: 'Supabase 连接', status: 'ok', message: '环境变量已配置' })
  }

  // 2. 环境变量
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL
  checks.push({
    name: '环境变量',
    status: appUrl ? 'ok' : 'warning',
    message: appUrl ? `APP_URL: ${appUrl}` : 'NEXT_PUBLIC_APP_URL 未配置，将使用默认值'
  })

  // 3. Node 版本
  const nodeVersion = process.version
  const nodeMajor = parseInt(nodeVersion.replace('v', '').split('.')[0], 10)
  checks.push({
    name: 'Node 版本',
    status: nodeMajor >= 18 ? 'ok' : 'error',
    message: `${nodeVersion} ${nodeMajor >= 18 ? '' : '(需要 >= 18)'}`
  })

  // 4. Next 版本
  let nextVersion = 'unknown'
  let nextOk = false
  try {
    const pkg = require('next/package.json')
    nextVersion = pkg.version
    const nextMajor = parseInt(nextVersion.split('.')[0], 10)
    nextOk = nextMajor >= 15
  } catch {
    // fallback
  }
  checks.push({
    name: 'Next 版本',
    status: nextOk ? 'ok' : 'warning',
    message: `v${nextVersion}`
  })

  // If Supabase not configured, return early
  if (!supabaseOk) {
    checks.push({ name: '数据库表完整性', status: 'warning', message: '等待 Supabase 配置后自动检测' })
    checks.push({ name: '安装状态', status: 'warning', message: '尚未检测' })
    checks.push({ name: '管理员账户', status: 'warning', message: '尚未创建' })
    return NextResponse.json({ installed: false, has_admin: false, checks })
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  // 5. 数据库表完整性 - non-blocking, tables may not exist yet before install
  let dbOk = false
  try {
    const { error } = await supabase.from('system_settings').select('key').limit(1)
    dbOk = !error
  } catch {
    dbOk = false
  }
  checks.push({
    name: '数据库表完整性',
    status: dbOk ? 'ok' : 'warning',
    message: dbOk ? '核心表可访问' : '表尚未创建，安装过程中将自动初始化'
  })

  // 6. 安装状态
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
  checks.push({
    name: '安装状态',
    status: installed ? 'ok' : 'warning',
    message: installed ? '系统已安装' : '尚未安装'
  })

  // 7. 管理员账户
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
  checks.push({
    name: '管理员账户',
    status: hasAdmin ? 'ok' : 'warning',
    message: hasAdmin ? '已存在管理员' : '尚未创建'
  })

  return NextResponse.json({ installed, has_admin: hasAdmin, checks })
}
