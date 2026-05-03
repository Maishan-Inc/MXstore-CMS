import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseConfigured = !!supabaseUrl && !!supabaseKey

  const checks: Array<{ name: string; status: string; message: string }> = []
  let supabase: Awaited<ReturnType<typeof import('@/lib/supabase/admin')['createAdminClient']>> | null = null
  let supabaseOk = false

  // 1. Supabase 连接
  if (!supabaseConfigured) {
    checks.push({ name: 'Supabase 连接', status: 'error', message: '缺少 NEXT_PUBLIC_SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY' })
  } else {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    supabase = createAdminClient()
    const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 })
    supabaseOk = !error
    checks.push({
      name: 'Supabase 连接',
      status: supabaseOk ? 'ok' : 'error',
      message: supabaseOk ? '连接成功' : `连接失败: ${error?.message ?? '未知错误'}`
    })
  }

  // 2. Node 版本
  const nodeVersion = process.version
  const nodeMajor = parseInt(nodeVersion.replace('v', '').split('.')[0], 10)
  checks.push({
    name: 'Node 版本',
    status: nodeMajor >= 18 ? 'ok' : 'error',
    message: `${nodeVersion} ${nodeMajor >= 18 ? '' : '(需要 >= 18)'}`
  })

  // 3. Next 版本
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

  if (!supabaseOk || !supabase) {
    checks.push({ name: '数据库表完整性', status: 'warning', message: '等待 Supabase 连接成功后检测' })
    checks.push({ name: '安装状态', status: 'ok', message: '尚未检测' })
    checks.push({ name: '管理员账户', status: 'ok', message: '尚未创建' })
    return NextResponse.json({ installed: false, has_admin: false, checks })
  }

  let settingsTableAvailable = false
  try {
    const { error } = await supabase.from('system_settings').select('key').limit(1)
    settingsTableAvailable = !error
  } catch {
    settingsTableAvailable = false
  }
  checks.push({
    name: '数据库表完整性',
    status: 'ok',
    message: settingsTableAvailable ? '核心表可访问' : '安装前不阻塞业务表检测，请继续完成初始化'
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
    status: 'ok',
    message: installed ? '系统已安装' : '尚未安装'
  })

  // 6. 管理员账户
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
    status: 'ok',
    message: hasAdmin ? '已存在管理员' : '尚未创建'
  })

  return NextResponse.json({ installed, has_admin: hasAdmin, checks })
}
