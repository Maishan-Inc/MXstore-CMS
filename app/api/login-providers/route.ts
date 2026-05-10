import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('login_providers')
      .select('id,provider_type,label,button_text,provider,connector_name,icon_url')
      .eq('enabled', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json([])
    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([])
  }
}
