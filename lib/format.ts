export function formatBytes(bytes?: number | null) {
  if (!bytes) return '未知大小'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`
}

export function formatMoney(cents?: number | null, currency = 'USD') {
  if (!cents) return '免费'
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency }).format(cents / 100)
}
