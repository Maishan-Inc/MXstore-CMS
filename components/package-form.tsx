'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { packageFormDefaults, type PackageFormValues } from '@/lib/admin/packages'
import { finishActionFeedback, startActionFeedback } from '@/components/action-feedback'

type PackageFormProps = {
  mode?: 'create' | 'edit'
  packageId?: string
  initialValues?: PackageFormValues
}

export function PackageForm({ mode = 'create', packageId, initialValues }: PackageFormProps) {
  const router = useRouter()
  const defaults = useMemo(() => initialValues ?? packageFormDefaults(), [initialValues])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(formData: FormData) {
    setLoading(true)
    setError(null)
    startActionFeedback()
    try {
      const payload = {
        name: formData.get('name'),
        description: formData.get('description'),
        badge: formData.get('badge'),
        display_price: formData.get('display_price'),
        traffic_label: formData.get('traffic_label'),
        cta_label: formData.get('cta_label'),
        features: String(formData.get('features') ?? '')
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        highlighted: formData.get('highlighted') === 'on',
        sort_order: Number(formData.get('sort_order') || 0),
        bytes_amount: Number(formData.get('bytes_amount')),
        chain_id: Number(formData.get('chain_id')),
        asset_type: formData.get('asset_type'),
        token_contract: formData.get('token_contract') || null,
        token_symbol: formData.get('token_symbol') || null,
        token_decimals: formData.get('token_decimals') ? Number(formData.get('token_decimals')) : null,
        amount_raw: String(formData.get('amount_raw')),
        pay_to_address: formData.get('pay_to_address'),
        enabled: formData.get('enabled') === 'on'
      }
      const res = await fetch(mode === 'create' ? '/api/admin/packages' : `/api/admin/packages?id=${packageId}`, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(await res.text())
      router.refresh()
      finishActionFeedback(mode === 'create' ? '套餐保存成功' : '套餐配置保存成功')
    } catch (e) {
      const message = e instanceof Error ? e.message : '保存失败'
      setError(message)
      finishActionFeedback(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={submit} className="grid gap-4 md:grid-cols-2">
      <label>
        <span className="label">套餐名称</span>
        <input name="name" defaultValue={defaults.name} className="input" required placeholder="100GB 流量包" />
      </label>
      <label>
        <span className="label">展示标签</span>
        <input name="badge" defaultValue={defaults.badge} className="input" placeholder="推荐 / 热门 / 限时" />
      </label>
      <label>
        <span className="label">展示价格</span>
        <input name="display_price" defaultValue={defaults.display_price} className="input" placeholder="0.005 ETH" />
      </label>
      <label>
        <span className="label">展示流量</span>
        <input name="traffic_label" defaultValue={defaults.traffic_label} className="input" placeholder="100GB" />
      </label>
      <label>
        <span className="label">按钮文案</span>
        <input name="cta_label" defaultValue={defaults.cta_label} className="input" required placeholder="钱包付款并自动校验" />
      </label>
      <label>
        <span className="label">排序</span>
        <input name="sort_order" defaultValue={defaults.sort_order} className="input" type="number" />
      </label>
      <label className="md:col-span-2">
        <span className="label">套餐说明</span>
        <textarea name="description" defaultValue={defaults.description} className="input min-h-24" placeholder="适用人群、使用场景、套餐说明" />
      </label>
      <label className="md:col-span-2">
        <span className="label">套餐权益，每行一条</span>
        <textarea name="features" defaultValue={defaults.features} className="input min-h-28" placeholder="到账后自动增加下载流量" />
      </label>
      <label>
        <span className="label">流量 bytes</span>
        <input name="bytes_amount" defaultValue={defaults.bytes_amount} className="input" type="number" required placeholder="107374182400" />
      </label>
      <label>
        <span className="label">链 ID</span>
        <input name="chain_id" defaultValue={defaults.chain_id} className="input" type="number" required />
      </label>
      <label>
        <span className="label">资产类型</span>
        <select name="asset_type" defaultValue={defaults.asset_type} className="input">
          <option value="native">原生币 native</option>
          <option value="erc20">ERC20</option>
        </select>
      </label>
      <label>
        <span className="label">Token 合约，native 留空</span>
        <input name="token_contract" defaultValue={defaults.token_contract} className="input" placeholder="0x..." />
      </label>
      <label>
        <span className="label">Token 符号</span>
        <input name="token_symbol" defaultValue={defaults.token_symbol} className="input" placeholder="ETH / USDT" />
      </label>
      <label>
        <span className="label">Token decimals</span>
        <input name="token_decimals" defaultValue={defaults.token_decimals} className="input" type="number" placeholder="18" />
      </label>
      <label>
        <span className="label">付款金额 amount_raw</span>
        <input name="amount_raw" defaultValue={defaults.amount_raw} className="input" required placeholder="1000000000000000" />
      </label>
      <label className="md:col-span-2">
        <span className="label">收款地址</span>
        <input name="pay_to_address" defaultValue={defaults.pay_to_address} className="input" required placeholder="0x..." />
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
        <input name="enabled" type="checkbox" defaultChecked={defaults.enabled} /> 启用此流量套餐
      </label>
      <label className="flex items-center gap-2 text-sm text-slate-600 md:col-span-2">
        <input name="highlighted" type="checkbox" defaultChecked={defaults.highlighted} /> 前台使用推荐高亮样式
      </label>
      <div className="md:col-span-2">
        <button disabled={loading} className="btn">{loading ? '保存中...' : mode === 'create' ? '保存套餐' : '保存套餐配置'}</button>
        {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
      </div>
    </form>
  )
}
