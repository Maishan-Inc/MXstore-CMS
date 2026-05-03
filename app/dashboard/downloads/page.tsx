import { redirect } from 'next/navigation'
import { getCurrentStoreUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatBytes } from '@/lib/format'

export default async function DownloadsPage() {
  const user = await getCurrentStoreUser()
  if (!user) redirect('/login')

  const supabase = createAdminClient()
  const { data: downloads, error } = await supabase
    .from('download_sessions')
    .select('id,created_at,status,bytes_charged,expires_at,apps(name),app_links(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">下载记录</h1>
        <p className="mt-2 text-sm text-slate-500">查看所有下载历史记录。</p>
      </div>

      <section className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">应用</th>
                <th className="px-5 py-3 font-medium">下载链接</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">扣减流量</th>
                <th className="px-5 py-3 font-medium">下载时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
              {downloads?.map((item) => {
                const appRecord = Array.isArray(item.apps) ? item.apps[0] : item.apps
                const linkRecord = Array.isArray(item.app_links) ? item.app_links[0] : item.app_links
                return (
                  <tr key={item.id}>
                    <td className="px-5 py-4 font-medium text-slate-900">{appRecord?.name ?? '未知应用'}</td>
                    <td className="px-5 py-4 text-slate-500">{linkRecord?.name ?? '-'}</td>
                    <td className="px-5 py-4">
                      <span className={item.status === 'issued'
                        ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700'
                        : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600'
                      }>{item.status}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatBytes(Number(item.bytes_charged ?? 0))}</td>
                    <td className="px-5 py-4 text-slate-500">{new Date(item.created_at).toLocaleString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!downloads?.length ? <p className="px-5 py-8 text-sm text-slate-500">暂无下载记录。</p> : null}
      </section>
    </div>
  )
}
