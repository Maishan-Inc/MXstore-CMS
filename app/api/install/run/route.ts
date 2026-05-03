import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { z } from 'zod'
import { applyInstallMigrations } from '@/lib/install/migrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const Schema = z.object({
  admin_username: z.string().min(2).max(50),
  admin_email: z.string().email(),
  admin_password: z.string().min(8).max(128),
  site_name: z.string().min(1).max(100).optional(),
  site_domain: z.string().url().optional()
})

export async function POST(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new NextResponse('Supabase 环境变量未配置，请先在 Vercel 中设置 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY', { status: 500 })
  }

  if (!process.env.SUPABASE_DB_URL) {
    return new NextResponse('缺少 SUPABASE_DB_URL，请在 Vercel 环境变量中添加 Supabase 数据库连接字符串后重新部署', { status: 500 })
  }

  const body = Schema.parse(await request.json())

  let migrations: Awaited<ReturnType<typeof applyInstallMigrations>>
  try {
    migrations = await applyInstallMigrations()
  } catch (error) {
    return new NextResponse(error instanceof Error ? error.message : '数据库初始化失败', { status: 500 })
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  const { data: installedSettings, error: installedError } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'installed')
    .maybeSingle()

  if (installedError) {
    return new NextResponse(`读取安装状态失败: ${installedError.message}`, { status: 500 })
  }

  if (installedSettings?.value === 'true') {
    return new NextResponse('系统已安装，不能重复安装', { status: 409 })
  }

  const { data: authUsers, error: listUsersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (listUsersError) {
    return new NextResponse(`读取认证用户失败: ${listUsersError.message}`, { status: 500 })
  }

  const normalizedEmail = body.admin_email.toLowerCase()
  const existingUser = authUsers.users.find((user: User) => user.email?.toLowerCase() === normalizedEmail)

  let authUserId = existingUser?.id

  if (!authUserId) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.admin_email,
      password: body.admin_password,
      email_confirm: true,
      user_metadata: { name: body.admin_username }
    })

    if (authError) {
      if (!authError.message.toLowerCase().includes('already been registered')) {
        return new NextResponse(`创建认证用户失败: ${authError.message}`, { status: 500 })
      }

      const { data: retryUsers, error: retryUsersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (retryUsersError) {
        return new NextResponse(`读取认证用户失败: ${retryUsersError.message}`, { status: 500 })
      }

      const retryUser = retryUsers.users.find((user: User) => user.email?.toLowerCase() === normalizedEmail)
      if (!retryUser) {
        return new NextResponse(`创建认证用户失败: ${authError.message}`, { status: 500 })
      }
      authUserId = retryUser.id
    } else {
      authUserId = authData.user?.id
    }
  } else {
    const { error: updateUserError } = await supabase.auth.admin.updateUserById(authUserId, {
      password: body.admin_password,
      email_confirm: true,
      user_metadata: { name: body.admin_username }
    })

    if (updateUserError) {
      return new NextResponse(`更新认证用户失败: ${updateUserError.message}`, { status: 500 })
    }
  }

  if (!authUserId) {
    return new NextResponse('无法获取管理员认证用户', { status: 500 })
  }

  const { error: profileError } = await supabase
    .from('store_users')
    .upsert(
      {
        auth_user_id: authUserId,
        email: body.admin_email,
        display_name: body.admin_username,
        role: 'admin'
      },
      { onConflict: 'auth_user_id' }
    )

  if (profileError) {
    return new NextResponse(`设置管理员角色失败: ${profileError.message}`, { status: 500 })
  }

  const siteName = body.site_name || 'MXStore'
  const siteDomain = body.site_domain || ''
  const now = new Date().toISOString()

  const settingsEntries = [
    { key: 'installed', value: 'true', group_name: 'system' },
    { key: 'site_name', value: siteName, group_name: 'site' },
    { key: 'site_domain', value: siteDomain, group_name: 'site' },
    { key: 'installed_at', value: now, group_name: 'system' }
  ]

  for (const entry of settingsEntries) {
    const { error } = await supabase.from('system_settings').upsert(entry, { onConflict: 'key' })
    if (error) {
      return new NextResponse(`写入系统设置失败: ${error.message}`, { status: 500 })
    }
  }

  return NextResponse.json({
    ok: true,
    message: 'MXStore 安装成功',
    admin_email: body.admin_email,
    migrations
  })
}
