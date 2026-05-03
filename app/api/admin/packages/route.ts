import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const Schema = z.object({
  name: z.string().min(1),
  bytes_amount: z.number().int().positive(),
  chain_id: z.number().int().positive(),
  asset_type: z.enum(['native', 'erc20']),
  token_contract: z.string().nullable().optional(),
  token_symbol: z.string().nullable().optional(),
  token_decimals: z.number().int().nullable().optional(),
  amount_raw: z.string().regex(/^\d+$/),
  pay_to_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  enabled: z.boolean().default(true)
})

export async function GET() {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('traffic_packages').select('*').order('created_at', { ascending: false })
  if (error) return new NextResponse(error.message, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  await requireAdmin()
  const body = Schema.parse(await request.json())
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('traffic_packages')
    .insert(body)
    .select('id')
    .single()
  if (error) return new NextResponse(error.message, { status: 400 })
  return NextResponse.json(data)
}

export async function PUT(request: Request) {
  await requireAdmin()
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return new NextResponse('缺少套餐 id', { status: 400 })

  const body = Schema.parse(await request.json())
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('traffic_packages')
    .update(body)
    .eq('id', id)
    .select('id')
    .single()
  if (error) return new NextResponse(error.message, { status: 400 })
  return NextResponse.json(data)
}
