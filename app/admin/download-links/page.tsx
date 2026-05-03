import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatBytes } from '@/lib/format'

export default async function AdminDownloadLinksPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')
  if (user.role !== 'admin') redirect('/dashboard')

  const supabase = createAdminClient()
  const { data: links, error } = await supabase
    .from('app_links')
    .select('id,name,input_url,link_kind,file_size_bytes,charge_traffic,sort_order,created_at,apps(name,slug)')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">下载链接</h1>
        <p className="mt-2 text-sm text-slate-500">查看所有应用的下载链接配置。</p>
      </div>

      <section className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">链接名称</th>
                <th className="px-5 py-3 font-medium">所属应用</th>
                <th className="px-5 py-3 font-medium">类型</th>
                <th className="px-5 py-3 font-medium">文件大小</th>
                <th className="px-5 py-3 font-medium">扣流量</th>
                <th className="px-5 py-3 font-medium">输入 URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
              {links?.map((link) => {
                const appRecord = Array.isArray(link.apps) ? link.apps[0] : link.apps
                return (
                  <tr key={link.id}>
                    <td className="px-5 py-4 font-medium text-slate-900">{link.name}</td>
                    <td className="px-5 py-4 text-slate-500">{appRecord?.name ?? '-'}</td>
                    <td className="px-5 py-4">
                      <span className={link.link_kind === 'openlist'
                        ? 'rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700'
                        : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600'
                      }>{link.link_kind}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatBytes(link.file_size_bytes)}</td>
                    <td className="px-5 py-4 text-slate-500">{link.charge_traffic ? '是' : '否'}</td>
                    <td className="max-w-xs truncate px-5 py-4 text-xs text-slate-500">{link.input_url}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!links?.length ? <p className="px-5 py-8 text-sm text-slate-500">暂无下载链接。</p> : null}
      </section>
    </div>
  )
}
