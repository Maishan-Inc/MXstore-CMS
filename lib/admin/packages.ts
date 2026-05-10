export type PackageFormValues = {
  id: string | null
  name: string
  description: string
  badge: string
  display_price: string
  traffic_label: string
  cta_label: string
  features: string
  highlighted: boolean
  sort_order: string
  bytes_amount: string
  chain_id: number
  asset_type: 'native' | 'erc20'
  token_contract: string
  token_symbol: string
  token_decimals: string
  amount_raw: string
  pay_to_address: string
  enabled: boolean
}

type ExistingPackage = {
  id: string
  name: string
  description?: string | null
  badge?: string | null
  display_price?: string | null
  traffic_label?: string | null
  cta_label?: string | null
  features?: string[] | null
  highlighted?: boolean | null
  sort_order?: number | null
  bytes_amount: number | string
  chain_id: number
  asset_type: 'native' | 'erc20'
  token_contract: string | null
  token_symbol: string | null
  token_decimals: number | null
  amount_raw: string | number
  pay_to_address: string
  enabled: boolean
}

export function packageFormDefaults(): PackageFormValues {
  return {
    id: null,
    name: '',
    description: '',
    badge: '',
    display_price: '',
    traffic_label: '',
    cta_label: '钱包付款并自动校验',
    features: '链上付款自动校验\n到账后自动增加下载流量\n支持手动粘贴 txHash 校验',
    highlighted: false,
    sort_order: '0',
    bytes_amount: '',
    chain_id: 8453,
    asset_type: 'native',
    token_contract: '',
    token_symbol: '',
    token_decimals: '',
    amount_raw: '',
    pay_to_address: '',
    enabled: true
  }
}

export function normalizePackagePayload(pkg: ExistingPackage): PackageFormValues {
  return {
    id: pkg.id,
    name: pkg.name,
    description: pkg.description ?? '',
    badge: pkg.badge ?? '',
    display_price: pkg.display_price ?? '',
    traffic_label: pkg.traffic_label ?? '',
    cta_label: pkg.cta_label ?? '钱包付款并自动校验',
    features: (pkg.features ?? []).join('\n'),
    highlighted: Boolean(pkg.highlighted),
    sort_order: pkg.sort_order == null ? '0' : String(pkg.sort_order),
    bytes_amount: String(pkg.bytes_amount),
    chain_id: pkg.chain_id,
    asset_type: pkg.asset_type,
    token_contract: pkg.token_contract ?? '',
    token_symbol: pkg.token_symbol ?? '',
    token_decimals: pkg.token_decimals == null ? '' : String(pkg.token_decimals),
    amount_raw: String(pkg.amount_raw),
    pay_to_address: pkg.pay_to_address,
    enabled: pkg.enabled
  }
}
