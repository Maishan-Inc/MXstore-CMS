'use client'

import { usePathname } from 'next/navigation'
import { AdminSidebar } from './admin-sidebar'

export function AdminSidebarWrapper() {
  const pathname = usePathname()
  return <AdminSidebar pathname={pathname} />
}
