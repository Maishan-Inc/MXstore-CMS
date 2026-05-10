'use client'

import { useState } from 'react'
import type { AccountType, EnterpriseCertificationStatus, TeamPlanStatus } from '@/lib/account'
import { getAccountTypeLabel } from '@/lib/account'
import { finishActionFeedback, startActionFeedback } from '@/components/action-feedback'

const enterpriseOptions: EnterpriseCertificationStatus[] = ['not_required', 'pending', 'verified', 'needs_more_info', 'rejected']
const teamOptions: TeamPlanStatus[] = ['none', 'pending', 'active', 'expired']

const enterpriseLabels: Record<EnterpriseCertificationStatus, string> = {
  not_required: '无需认证',
  pending: '审核中',
  verified: '已认证',
  needs_more_info: '补充材料',
  rejected: '未通过'
}

const teamLabels: Record<TeamPlanStatus, string> = {
  none: '未开通',
  pending: '待开通',
  active: '已开通',
  expired: '已过期'
}

export function AdminUserIdentity({
  userId,
  accountType,
  enterpriseStatus,
  teamPlanStatus,
  organizationName,
  developerName
}: {
  userId: string
  accountType: AccountType
  enterpriseStatus: EnterpriseCertificationStatus
  teamPlanStatus: TeamPlanStatus
  organizationName: string | null
  developerName: string | null
}) {
  const [enterprise, setEnterprise] = useState<EnterpriseCertificationStatus>(enterpriseStatus)
  const [team, setTeam] = useState<TeamPlanStatus>(teamPlanStatus)
  const [organization, setOrganization] = useState(organizationName ?? '')
  const [developer, setDeveloper] = useState(developerName ?? '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function save() {
    setLoading(true)
    setMessage(null)
    startActionFeedback()
    try {
      const response = await fetch(`/api/admin/users/${userId}/identity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enterprise_certification_status: enterprise,
          team_plan_status: team,
          organization_name: organization,
          developer_name: developer
        })
      })
      if (!response.ok) throw new Error(await response.text())
      setMessage('已保存')
      finishActionFeedback('用户认证信息保存成功')
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败'
      setMessage(message)
      finishActionFeedback(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-slate-600">{getAccountTypeLabel(accountType)}</p>
      <div className="grid gap-2">
        <label>
          <span className="label">开发者名</span>
          <input value={developer} onChange={(event) => setDeveloper(event.target.value)} className="input" />
        </label>
        <label>
          <span className="label">主体名称</span>
          <input value={organization} onChange={(event) => setOrganization(event.target.value)} className="input" />
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          <label>
            <span className="label">企业认证</span>
            <select value={enterprise} onChange={(event) => setEnterprise(event.target.value as EnterpriseCertificationStatus)} className="input">
              {enterpriseOptions.map((option) => <option key={option} value={option}>{enterpriseLabels[option]}</option>)}
            </select>
          </label>
          <label>
            <span className="label">团队套餐</span>
            <select value={team} onChange={(event) => setTeam(event.target.value as TeamPlanStatus)} className="input">
              {teamOptions.map((option) => <option key={option} value={option}>{teamLabels[option]}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => void save()} disabled={loading} className="btn-secondary">
          {loading ? '保存中...' : '保存认证'}
        </button>
        {message ? <span className="text-xs text-slate-500">{message}</span> : null}
      </div>
    </div>
  )
}
