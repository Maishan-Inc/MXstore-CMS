import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const Schema = z.object({
  admin_username: z.string().min(2).max(50),
  admin_email: z.string().email(),
  admin_password: z.string().min(8).max(128),
  site_name: z.string().min(1).max(100).optional()
})

export async function POST(request: NextRequest) {
  const supabase = createAdminClient()

  // Check if already installed
  try {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'installed')
      .maybeSingle()
    if (data?.value === 'true') {
      return new NextResponse('系统已安装，不能重复安装', { status: 409 })
    }
  } catch {
    // Table might not exist - proceed
  }

  const body = Schema.parse(await request.json())

  // Create admin user via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: body.admin_email,
    password: body.admin_password,
    email_confirm: true,
    user_metadata: { name: body.admin_username }
  })

  if (authError) {
    return new NextResponse(`创建认证用户失败: ${authError.message}`, { status: 500 })
  }

  // Wait for the trigger to create store_users record, then update role to admin
  // The trigger handle_new_auth_user() will auto-create a store_users row
  // We need to update it to admin role
  if (authData.user) {
    // Small delay for trigger to fire, then update role
    await new Promise((resolve) => setTimeout(resolve, 500))

    const { error: roleError } = await supabase
      .from('store_users')
      .update({ role: 'admin', display_name: body.admin_username })
      .eq('auth_user_id', authData.user.id)

    if (roleError) {
      // If trigger didn't fire yet, insert directly
      const { error: insertError } = await supabase
        .from('store_users')
        .insert({
          auth_user_id: authData.user.id,
          email: body.admin_email,
          display_name: body.admin_username,
          role: 'admin'
        })
      if (insertError) {
        return new NextResponse(`设置管理员角色失败: ${insertError.message}`, { status: 500 })
      }
    }
  }

  // Mark as installed
  const siteName = body.site_name || 'MXStore'
  const now = new Date().toISOString()

  const settingsEntries = [
    { key: 'installed', value: 'true', group_name: 'system' },
    { key: 'site_name', value: siteName, group_name: 'site' },
    { key: 'installed_at', value: now, group_name: 'system' }
  ]

  for (const entry of settingsEntries) {
    await supabase.from('system_settings').upsert(entry, { onConflict: 'key' })
  }

  return NextResponse.json({
    ok: true,
    message: 'MXStore 安装成功',
    admin_email: body.admin_email
  })
}
