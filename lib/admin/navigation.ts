export const adminNavigationItems = [
  { href: '/admin', label: '仪表盘' },
  { href: '/admin/apps', label: '应用管理' },
  { href: '/admin/download-links', label: '下载链接' },
  { href: '/admin/orders', label: '订单支付' },
  { href: '/admin/users', label: '用户管理' },
  { href: '/admin/statistics', label: '数据统计' },
  { href: '/admin/settings', label: '系统设置' }
]

export function isAdminPath(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}
