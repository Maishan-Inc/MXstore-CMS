'use client'

import { useState } from 'react'

export function UserRoleSelect({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function updateRole(newRole: string) {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      })
      if (!res.ok) throw new Error(await res.text())
      setRole(newRole)
      setMessage('已更新')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        disabled={loading}
        onChange={(e) => updateRole(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
      >
        <option value="user">user</option>
        <option value="admin">admin</option>
      </select>
      {message ? <span className="text-xs text-slate-500">{message}</span> : null}
    </div>
  )
}
