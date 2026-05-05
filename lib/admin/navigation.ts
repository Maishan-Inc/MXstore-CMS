export const adminNavigationItems = [
  { href: '/admin', label: '仪表盘', icon: 'layout-dashboard' },
  { href: '/admin/apps', label: '应用管理', icon: 'package' },
  { href: '/admin/download-links', label: '下载链接', icon: 'link' },
  { href: '/admin/settings/domains', label: '域名与 Token', icon: 'globe' },
  { href: '/admin/settings/packages', label: '流量套餐', icon: 'clock' },
  { href: '/admin/orders', label: '订单支付', icon: 'credit-card' },
  { href: '/admin/users', label: '用户管理', icon: 'users' },
  { href: '/admin/statistics', label: '数据统计', icon: 'bar-chart' },
  { href: '/admin/settings', label: '系统设置', icon: 'settings' }
]

export function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}
