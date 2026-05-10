export function getShellTitle(pathname: string) {
  if (pathname === '/admin') return '管理员仪表盘'
  if (pathname.startsWith('/admin/apps')) return '应用管理'
  if (pathname.startsWith('/admin/settings/domains')) return '域名与 Token'
  if (pathname.startsWith('/admin/settings/packages')) return '流量套餐'
  if (pathname.startsWith('/admin/settings/footer')) return '底部栏设置'
  if (pathname.startsWith('/admin/settings')) return '系统设置'
  if (pathname.startsWith('/admin/orders')) return '订单支付'
  if (pathname.startsWith('/admin/users')) return '用户管理'
  return '管理员后台'
}
