export type DomainFormValues = {
  id: string | null
  domain: string
  openlist_base_url: string
  admin_token: string
  sign_ttl_seconds: number
  enabled: boolean
}

type ExistingDomain = {
  id: string
  domain: string
  openlist_base_url: string
  sign_ttl_seconds: number
  enabled: boolean
}

export function domainFormDefaults(): DomainFormValues {
  return {
    id: null,
    domain: '',
    openlist_base_url: '',
    admin_token: '',
    sign_ttl_seconds: 300,
    enabled: true
  }
}

export function normalizeDomainPayload(domain: ExistingDomain): DomainFormValues {
  return {
    id: domain.id,
    domain: domain.domain,
    openlist_base_url: domain.openlist_base_url,
    admin_token: '',
    sign_ttl_seconds: domain.sign_ttl_seconds,
    enabled: domain.enabled
  }
}
