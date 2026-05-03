export type PackageFormValues = {
  id: string | null
  name: string
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
