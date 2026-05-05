import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { applyInstallMigrations } from '@/lib/install/migrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST() {
  await requireAdmin()

  if (!process.env.SUPABASE_DB_URL) {
    return new NextResponse('缺少 SUPABASE_DB_URL，无法自动更新数据库', { status: 500 })
  }

  try {
    const result = await applyInstallMigrations()
    return NextResponse.json({
      ok: true,
      applied: result.applied,
      skipped: result.skipped
    })
  } catch (error) {
    return new NextResponse(error instanceof Error ? error.message : '数据库更新失败', { status: 500 })
  }
}

