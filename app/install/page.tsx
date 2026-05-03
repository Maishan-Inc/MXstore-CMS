'use client'

import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react'

type InstallStatus = {
  installed: boolean
  has_admin: boolean
  checks: Array<{ name: string; status: string; message: string }>
}

const steps = [
  { title: '安装协议', caption: '请阅读并同意安装许可协议。' },
  { title: '环境检测', caption: '确认数据库连接与运行环境。' },
  { title: '管理员账号', caption: '创建第一个管理员账户。' },
  { title: '确认安装', caption: '写入初始数据并完成安装。' }
]

export default function InstallPage() {
  const [stepIndex, setStepIndex] = useState(0)
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const [agreementRead, setAgreementRead] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [checking, setChecking] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [statusMsg, setStatusMsg] = useState('正在检测安装状态...')
  const [toastVisible, setToastVisible] = useState(false)
  const [toastTone, setToastTone] = useState<'info' | 'success' | 'warning'>('info')
  const [envChecks, setEnvChecks] = useState<Array<{ name: string; status: string; message: string }>>([])
  const [installResult, setInstallResult] = useState<{ ok: boolean; message: string } | null>(null)

  const [form, setForm] = useState({
    site_name: 'MXStore',
    admin_username: 'admin',
    admin_email: '',
    admin_password: ''
  })

  const agreementRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const showToast = useCallback((msg: string, tone: 'info' | 'success' | 'warning' = 'info') => {
    setStatusMsg(msg)
    setToastTone(tone)
    setToastVisible(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastVisible(false), 3500)
  }, [])

  const checkStatus = useCallback(async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/install/status')
      const data: InstallStatus = await res.json()
      setInstalled(data.installed)
      setEnvChecks(data.checks)
      if (data.installed) {
        showToast('系统已安装，不能重复安装。', 'success')
        setStepIndex(3)
      } else {
        showToast('系统尚未安装，请按步骤完成初始化。', 'info')
      }
    } catch {
      showToast('安装状态检测失败', 'warning')
    } finally {
      setChecking(false)
    }
  }, [showToast])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  function onAgreementScroll(e: React.UIEvent<HTMLDivElement>) {
    const t = e.currentTarget
    setAgreementRead(t.scrollTop + t.clientHeight >= t.scrollHeight - 4)
  }

  async function runInstall(e: FormEvent) {
    e.preventDefault()
    setInstalling(true)
    setInstallResult(null)
    try {
      const res = await fetch('/api/install/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setInstallResult(data)
      showToast('安装完成！', 'success')
      await checkStatus()
      setStepIndex(3)
    } catch (err) {
      showToast(err instanceof Error ? err.message : '安装失败', 'warning')
    } finally {
      setInstalling(false)
    }
  }

  const canNext = stepIndex === 0 ? agreementAccepted
    : stepIndex === 1 ? true
    : stepIndex === 2 ? (form.admin_username.length >= 2 && form.admin_email.includes('@') && form.admin_password.length >= 8)
    : false

  function nextStep() {
    if (stepIndex < steps.length - 1 && canNext) setStepIndex(stepIndex + 1)
  }

  function prevStep() {
    if (stepIndex > 0 && !installed) setStepIndex(stepIndex - 1)
  }

  const progress = ((stepIndex + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      <div className={`fixed left-1/2 top-6 z-50 -translate-x-1/2 transition-all duration-300 ${toastVisible ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-2'}`}>
        <div className={`rounded-2xl px-6 py-3 text-sm font-medium shadow-lg ${toastTone === 'success' ? 'bg-emerald-600 text-white' : toastTone === 'warning' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white'}`}>
          {statusMsg}
        </div>
      </div>

      <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-4 py-12">
        {!agreementAccepted ? (
          /* Agreement Page */
          <section className="w-full max-w-2xl">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white">M</div>
              <h1 className="text-2xl font-bold text-slate-900">MXStore 安装向导</h1>
              <p className="mt-2 text-sm text-slate-500">欢迎使用 MXStore 应用商店管理系统</p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6">
                <p className="text-xs font-medium uppercase tracking-widest text-blue-600">安装许可与隐私政策</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">使用前请阅读并同意协议</h2>
              </div>

              <div
                ref={agreementRef}
                onScroll={onAgreementScroll}
                className="mb-6 max-h-80 space-y-4 overflow-y-auto rounded-2xl bg-slate-50 p-6 text-sm leading-relaxed text-slate-600"
              >
                <p>
                  MXStore（MXstoreCMS）是一个应用商店内容管理系统。安装和使用本程序即表示你同意以下条款。
                </p>
                <p>
                  本程序基于 Supabase Cloud 作为数据库服务，部署于 Vercel 平台。安装过程中需要你提供有效的 Supabase 项目连接信息（URL、Anon Key、Service Role Key）。你应确保这些信息的真实性和安全性。
                </p>
                <p>
                  安装程序将在你的 Supabase 数据库中创建必要的数据表、行级安全策略（RLS）和初始管理员账号。安装完成后，管理员账号将拥有系统的完全管理权限，请妥善保管管理员密码。
                </p>
                <p>
                  你应自行负责部署环境的安全性，包括但不限于：环境变量的保密、Supabase 项目的访问控制、Vercel 部署配置、域名与 SSL 证书的配置。任何因配置不当导致的安全问题由部署者自行承担。
                </p>
                <p>
                  本程序会记录安装时间、站点名称等基本信息到数据库中。这些信息仅用于系统运行和管理，不会被用于其他用途。
                </p>
                <p>
                  你不得移除、修改或隐藏本程序中的版权声明和授权信息。未经授权，不得将本程序用于商业转售或二次分发。
                </p>
                <p>
                  如果你不同意上述条款，请停止安装并删除本程序。继续安装表示你已阅读、理解并同意本协议。
                </p>
                <p>
                  请继续向下滚动以阅读完整内容。滚动到底部后，&ldquo;我同意此协议&rdquo;按钮将变为可用状态。
                </p>
              </div>

              <button
                type="button"
                disabled={!agreementRead}
                onClick={() => setAgreementAccepted(true)}
                className="w-full rounded-2xl bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                {agreementRead ? '我同意此协议' : '请阅读到底部后可同意'}
              </button>
            </div>
          </section>
        ) : (
          /* Wizard */
          <section className="w-full">
            {/* Step Indicators */}
            <div className="mb-8 flex items-center justify-center gap-2">
              {steps.map((step, i) => (
                <button
                  key={step.title}
                  type="button"
                  disabled={installed || i > stepIndex + 1}
                  onClick={() => { if (!installed && i <= stepIndex + 1) setStepIndex(i) }}
                  className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm transition ${
                    i === stepIndex
                      ? 'bg-blue-600 text-white shadow-sm'
                      : i < stepIndex || installed
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-white text-slate-400'
                  }`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold" style={i === stepIndex ? { background: 'rgba(255,255,255,0.25)' } : {}}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="hidden sm:inline">{step.title}</span>
                </button>
              ))}
            </div>

            {/* Main Card */}
            <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">M</div>
                  <h2 className="mt-3 text-xl font-semibold text-slate-900">{steps[stepIndex].title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{steps[stepIndex].caption}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${installed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {installed ? '已安装' : '待安装'}
                </span>
              </div>

              {/* Step Content */}
              <div className="mb-8">
                {stepIndex === 0 && (
                  <div className="rounded-2xl bg-emerald-50 p-6 text-center">
                    <svg className="mx-auto mb-3 h-12 w-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <p className="text-lg font-medium text-emerald-800">协议已同意</p>
                    <p className="mt-1 text-sm text-emerald-600">请点击&ldquo;下一步&rdquo;继续环境检测。</p>
                  </div>
                )}

                {stepIndex === 1 && (
                  <div className="space-y-3">
                    {envChecks.map((check) => (
                      <div key={check.name} className="flex items-center gap-4 rounded-2xl border border-slate-200 px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${check.status === 'ok' ? 'bg-emerald-50 text-emerald-700' : check.status === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                          {check.status === 'ok' ? '正常' : check.status === 'error' ? '异常' : '待检测'}
                        </span>
                        <div>
                          <p className="font-medium text-slate-900">{check.name}</p>
                          <p className="text-xs text-slate-500">{check.message}</p>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      disabled={checking}
                      onClick={checkStatus}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {checking ? '检测中...' : '重新检测'}
                    </button>
                  </div>
                )}

                {stepIndex === 2 && (
                  <form id="install-form" onSubmit={runInstall} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">站点名称</label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        value={form.site_name}
                        onChange={(e) => setForm({ ...form, site_name: e.target.value })}
                        disabled={installed}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">管理员用户名</label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        value={form.admin_username}
                        onChange={(e) => setForm({ ...form, admin_username: e.target.value })}
                        disabled={installed}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">管理员邮箱</label>
                      <input
                        type="email"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="admin@example.com"
                        value={form.admin_email}
                        onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                        disabled={installed}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">管理员密码</label>
                      <input
                        type="password"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="至少 8 位"
                        value={form.admin_password}
                        onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                        disabled={installed}
                      />
                      {form.admin_password.length > 0 && form.admin_password.length < 8 && (
                        <p className="mt-1 text-xs text-rose-500">密码长度至少 8 位</p>
                      )}
                    </div>
                  </form>
                )}

                {stepIndex === 3 && (
                  <>
                    {!installed ? (
                      <div className="space-y-3">
                        <div className="rounded-2xl bg-slate-900 p-5 font-mono text-sm">
                          {[
                            { text: `mxstore db:check --supabase=${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'pending'}`, done: true },
                            { text: `mxstore migrate --apply`, done: true },
                            { text: `mxstore admin:create --user="${form.admin_username}" --email="${form.admin_email}"`, done: !!installResult },
                            { text: `mxstore settings:init --site="${form.site_name}"`, done: !!installResult },
                            { text: `mxstore install:lock --status=installed`, done: installed }
                          ].map((line, i) => (
                            <div key={i} className={`flex items-center gap-3 py-1 ${line.done ? 'text-emerald-400' : installing ? 'text-amber-400' : 'text-slate-500'}`}>
                              <span className="w-10 text-right text-xs">{line.done ? 'done' : installing ? 'run' : 'wait'}</span>
                              <code>{line.text}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl bg-emerald-50 py-12 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                          <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h3 className="text-xl font-semibold text-emerald-900">安装完成</h3>
                        <p className="mt-2 text-sm text-emerald-700">管理员账号已创建，数据库已初始化。</p>
                        <a
                          href="/login"
                          className="mt-6 inline-block rounded-2xl bg-blue-600 px-8 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                        >
                          进入登录页面
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                <button
                  type="button"
                  disabled={stepIndex === 0 || installed}
                  onClick={prevStep}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  上一步
                </button>
                {stepIndex < 3 ? (
                  <button
                    type="button"
                    disabled={!canNext}
                    onClick={nextStep}
                    className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    下一步
                  </button>
                ) : !installed ? (
                  <button
                    type="submit"
                    form="install-form"
                    disabled={installing || installed}
                    className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    {installing ? '安装中...' : '开始安装'}
                  </button>
                ) : null}
              </div>

              {/* Progress bar */}
              <div className="mt-6 h-1 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>

              <p className="mt-4 text-center text-xs text-slate-400">Copyright &copy; 2026 MXStore. All rights reserved.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
