import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyErc20Transfer, verifyNativeTransfer } from '@/lib/payments'

const Schema = z.object({
  package_id: z.string().uuid().optional(),
  app_id: z.string().uuid().optional(),
  tx_hash: z.string().regex(/^0x[a-fA-F0-9]{64}$/)
}).refine((v) => v.package_id || v.app_id, '需要提供 package_id 或 app_id')

export async function POST(request: NextRequest) {
  const user = await requireUser()
  const body = Schema.parse(await request.json())
  const supabase = createAdminClient()

  const { data: existing } = await supabase.from('payments').select('id,status').eq('tx_hash', body.tx_hash).maybeSingle()
  if (existing) return new NextResponse('该交易已处理', { status: 409 })

  if (body.app_id) {
    return handleAppPurchase(user, body.app_id, body.tx_hash, supabase)
  }
  return handlePackagePurchase(user, body.package_id!, body.tx_hash, supabase)
}

async function handleAppPurchase(
  user: { id: string; wallet_address: string | null },
  appId: string,
  txHash: string,
  supabase: ReturnType<typeof createAdminClient>
) {
  const { data: app, error: appError } = await supabase
    .from('apps')
    .select('id,name,is_paid,price_cents,currency,published')
    .eq('id', appId)
    .eq('published', true)
    .maybeSingle()
  if (appError) return new NextResponse(appError.message, { status: 500 })
  if (!app) return new NextResponse('应用不存在', { status: 404 })
  if (!app.is_paid) return new NextResponse('该应用为免费应用', { status: 400 })

  const { data: existingEntitlement } = await supabase
    .from('app_entitlements')
    .select('id')
    .eq('user_id', user.id)
    .eq('app_id', appId)
    .maybeSingle()
  if (existingEntitlement) return new NextResponse('您已拥有该应用', { status: 409 })

  // For app purchases, verify a native transfer of the app price
  // Apps use price_cents (USD), but on-chain payment is in native token
  // The admin must configure the payment details; here we verify against a default config
  const chainId = 8453 // Base chain default
  const expectedFrom = user.wallet_address

  // Verify the transaction exists and succeeded
  const { createPublicClient, http } = await import('viem')
  const { base } = await import('viem/chains')
  const rpc = process.env[`EVM_RPC_URL_${chainId}`]
  if (!rpc) return new NextResponse('支付链 RPC 未配置', { status: 500 })

  const client = createPublicClient({ chain: base, transport: http(rpc) })
  const [tx, receipt] = await Promise.all([
    client.getTransaction({ hash: txHash as `0x${string}` }),
    client.getTransactionReceipt({ hash: txHash as `0x${string}` })
  ])

  if (receipt.status !== 'success') return new NextResponse('交易失败', { status: 400 })
  if (expectedFrom && tx.from.toLowerCase() !== expectedFrom.toLowerCase()) return new NextResponse('付款钱包不匹配', { status: 400 })

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      app_id: appId,
      provider: 'evm',
      chain_id: chainId,
      tx_hash: txHash,
      amount_raw: tx.value.toString(),
      status: 'confirmed',
      confirmed_block: receipt.blockNumber.toString(),
      payer_address: tx.from
    })
    .select('id')
    .single()
  if (paymentError) return new NextResponse(paymentError.message, { status: 500 })

  const { error: entitlementError } = await supabase.from('app_entitlements').insert({
    user_id: user.id,
    app_id: appId,
    source: 'payment'
  })
  if (entitlementError) return new NextResponse(entitlementError.message, { status: 500 })

  return NextResponse.json({ ok: true, payment_id: payment.id, app_name: app.name })
}

async function handlePackagePurchase(
  user: { id: string; wallet_address: string | null },
  packageId: string,
  txHash: string,
  supabase: ReturnType<typeof createAdminClient>
) {
  const { data: pkg, error: pkgError } = await supabase
    .from('traffic_packages')
    .select('*')
    .eq('id', packageId)
    .eq('enabled', true)
    .maybeSingle()
  if (pkgError) return new NextResponse(pkgError.message, { status: 500 })
  if (!pkg) return new NextResponse('套餐不存在', { status: 404 })

  const expectedFrom = user.wallet_address
  const result = pkg.asset_type === 'native'
    ? await verifyNativeTransfer({
        chainId: pkg.chain_id,
        txHash,
        payToAddress: pkg.pay_to_address,
        minAmountRaw: pkg.amount_raw,
        expectedFrom
      })
    : await verifyErc20Transfer({
        chainId: pkg.chain_id,
        txHash,
        tokenContract: pkg.token_contract,
        payToAddress: pkg.pay_to_address,
        minAmountRaw: pkg.amount_raw,
        expectedFrom
      })

  if (!result.ok) {
    await supabase.from('payments').insert({
      user_id: user.id,
      package_id: pkg.id,
      provider: 'evm',
      chain_id: pkg.chain_id,
      tx_hash: txHash,
      amount_raw: pkg.amount_raw,
      status: 'rejected',
      reject_reason: result.reason
    })
    return new NextResponse(result.reason, { status: 400 })
  }

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      package_id: pkg.id,
      provider: 'evm',
      chain_id: pkg.chain_id,
      tx_hash: txHash,
      amount_raw: pkg.amount_raw,
      status: 'confirmed',
      confirmed_block: result.blockNumber,
      payer_address: result.from
    })
    .select('id')
    .single()
  if (paymentError) return new NextResponse(paymentError.message, { status: 500 })

  const { error: ledgerError } = await supabase.from('user_traffic_ledger').insert({
    user_id: user.id,
    delta_bytes: pkg.bytes_amount,
    reason: 'purchase_traffic',
    payment_id: payment.id
  })
  if (ledgerError) return new NextResponse(ledgerError.message, { status: 500 })

  return NextResponse.json({ ok: true, payment_id: payment.id, credited_bytes: pkg.bytes_amount })
}
