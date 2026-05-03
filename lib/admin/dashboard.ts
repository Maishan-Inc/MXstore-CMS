export function getDashboardMetrics(values: {
  appCount: number
  todayDownloadCount: number
  confirmedPaymentCount: number
  activeUserCount: number
}) {
  return [
    { label: '应用总数', value: String(values.appCount) },
    { label: '今日下载', value: String(values.todayDownloadCount) },
    { label: '付费订单', value: String(values.confirmedPaymentCount) },
    { label: '活跃用户', value: String(values.activeUserCount) }
  ]
}
