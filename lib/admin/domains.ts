export function normalizeDomain(input: string) {
  return input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
}

export function normalizeOpenListBaseUrl(input: string) {
  return input.trim().replace(/\/$/, '')
}
