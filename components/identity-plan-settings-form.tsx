'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import {
  defaultIdentityPlanSettings,
  identityPlanTypes,
  type IdentityPlan,
  type IdentityPlanSettings,
  type IdentityPlanType
} from '@/lib/identity-plans'
import { finishActionFeedback, startActionFeedback } from '@/components/action-feedback'

type IdentityPlanSettingsFormProps = {
  initialSettings: IdentityPlanSettings
}

export function IdentityPlanSettingsForm({ initialSettings }: IdentityPlanSettingsFormProps) {
  const router = useRouter()
  const [settings, setSettings] = useState<IdentityPlanSettings>(initialSettings)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updatePlan<K extends keyof IdentityPlan>(type: IdentityPlanType, key: K, value: IdentityPlan[K]) {
    setSettings((current) => ({
      ...current,
      plans: {
        ...current.plans,
        [type]: {
          ...current.plans[type],
          [key]: value
        }
      }
    }))
  }

  function featureText(plan: IdentityPlan) {
    return plan.features.join('\n')
  }

  function updateFeatureText(type: IdentityPlanType, value: string) {
    const features = value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
    updatePlan(type, 'features', features.length ? features : ['请填写套餐权益'])
  }

  async function submit() {
    setLoading(true)
    setError(null)
    startActionFeedback()
    try {
      const res = await fetch('/api/admin/identity-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (!res.ok) throw new Error(await res.text())
      router.refresh()
      finishActionFeedback('身份套餐配置保存成功')
    } catch (e) {
      const message = e instanceof Error ? e.message : '保存失败'
      setError(message)
      finishActionFeedback(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="label">页面标题</span>
          <input
            value={settings.pageTitle}
            onChange={(event) => setSettings((current) => ({ ...current, pageTitle: event.target.value }))}
            className="input"
          />
        </label>
        <label>
          <span className="label">页面副标题</span>
          <input
            value={settings.pageSubtitle}
            onChange={(event) => setSettings((current) => ({ ...current, pageSubtitle: event.target.value }))}
            className="input"
          />
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {identityPlanTypes.map((type) => {
          const plan = settings.plans[type]
          return (
            <section key={type} className="rounded-[24px] border border-[#0e0f0c]/10 bg-white p-5 shadow-[rgba(14,15,12,0.12)_0_0_0_1px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-[#0e0f0c]">{plan.title}</h3>
                  <p className="mt-1 text-sm text-[#868685]">{plan.subtitle}</p>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#454745]">
                  <input type="checkbox" checked={plan.enabled} onChange={(event) => updatePlan(type, 'enabled', event.target.checked)} />
                  显示
                </label>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label>
                  <span className="label">身份名称</span>
                  <input value={plan.title} onChange={(event) => updatePlan(type, 'title', event.target.value)} className="input" />
                </label>
                <label>
                  <span className="label">标签</span>
                  <input value={plan.badge} onChange={(event) => updatePlan(type, 'badge', event.target.value)} className="input" placeholder="Free / 推荐" />
                </label>
                <label>
                  <span className="label">副标题</span>
                  <input value={plan.subtitle} onChange={(event) => updatePlan(type, 'subtitle', event.target.value)} className="input" />
                </label>
                <label>
                  <span className="label">排序</span>
                  <input
                    value={plan.sortOrder}
                    onChange={(event) => updatePlan(type, 'sortOrder', Number(event.target.value))}
                    className="input"
                    type="number"
                  />
                </label>
                <label>
                  <span className="label">价格文案</span>
                  <input value={plan.priceLabel} onChange={(event) => updatePlan(type, 'priceLabel', event.target.value)} className="input" />
                </label>
                <label>
                  <span className="label">周期文案</span>
                  <input value={plan.periodLabel} onChange={(event) => updatePlan(type, 'periodLabel', event.target.value)} className="input" />
                </label>
                <label className="md:col-span-2">
                  <span className="label">行动按钮文案</span>
                  <input value={plan.ctaLabel} onChange={(event) => updatePlan(type, 'ctaLabel', event.target.value)} className="input" />
                </label>
                <label className="md:col-span-2">
                  <span className="label">说明</span>
                  <textarea
                    value={plan.description}
                    onChange={(event) => updatePlan(type, 'description', event.target.value)}
                    className="input min-h-24"
                  />
                </label>
                <label className="md:col-span-2">
                  <span className="label">身份选择卡片备注</span>
                  <textarea value={plan.note} onChange={(event) => updatePlan(type, 'note', event.target.value)} className="input min-h-24" />
                </label>
                <label className="md:col-span-2">
                  <span className="label">套餐权益，每行一条</span>
                  <textarea
                    value={featureText(plan)}
                    onChange={(event) => updateFeatureText(type, event.target.value)}
                    className="input min-h-32"
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-[#454745]">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={plan.highlighted} onChange={(event) => updatePlan(type, 'highlighted', event.target.checked)} />
                  推荐样式
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={plan.freeTierEnabled}
                    onChange={(event) => updatePlan(type, 'freeTierEnabled', event.target.checked)}
                  />
                  Free 层级
                </label>
              </div>
            </section>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={submit} disabled={loading} className="btn gap-2">
          <Save className="h-4 w-4" />
          {loading ? '保存中...' : '保存身份套餐配置'}
        </button>
        <button type="button" onClick={() => setSettings(defaultIdentityPlanSettings)} disabled={loading} className="btn-secondary">
          还原默认文案
        </button>
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      </div>
    </div>
  )
}
