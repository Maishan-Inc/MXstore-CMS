'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type InstallStatus = {
  installed: boolean
  has_admin: boolean
  checks: Array<{ name: string; status: string; message: string }>
}

const steps = [
  { title: '环境检测', caption: '确认运行环境与数据库连接。' },
  { title: '数据库连接', caption: '使用 Supabase Cloud 托管数据库。' },
  { title: '管理员账号', caption: '创建首次登录后台的管理员。' },
  { title: '确认安装', caption: '写入基础数据并锁定安装状态。' }
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
    site_domain: '',
    admin_username: 'admin',
    admin_email: 'admin@example.com',
    admin_password: 'admin1234'
  })

  const agreementRef = useRef<HTMLDivElement>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const showToast = useCallback((msg: string, tone: 'info' | 'success' | 'warning' = 'info') => {
    setStatusMsg(msg)
    setToastTone(tone)
    setToastVisible(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastVisible(false), 3200)
  }, [])

  const checkStatus = useCallback(async () => {
    setChecking(true)
    try {
      const res = await fetch('/api/install/status')
      const data: InstallStatus = await res.json()
      setInstalled(data.installed)
      setEnvChecks(data.checks)
      if (data.installed) {
        window.location.replace('/')
        return
      }
      showToast('系统尚未安装，请按步骤完成初始化。', 'info')
    } catch {
      showToast('安装状态检测失败', 'warning')
    } finally {
      setChecking(false)
    }
  }, [showToast])

  useEffect(() => {
    // Auto-fill domain with current origin
    setForm((f) => ({ ...f, site_domain: window.location.origin }))
    checkStatus()
  }, [checkStatus])

  function onAgreementScroll(e: React.UIEvent<HTMLDivElement>) {
    const t = e.currentTarget
    setAgreementRead(t.scrollTop + t.clientHeight >= t.scrollHeight - 4)
  }

  async function runInstall() {
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
      showToast('初始化数据执行完成。', 'success')
      await checkStatus()
      setStepIndex(3)
    } catch (err) {
      showToast(err instanceof Error ? err.message : '安装失败', 'warning')
    } finally {
      setInstalling(false)
    }
  }

  const hasError = envChecks.some((c) => c.status === 'error')
  const allChecksOk = envChecks.length > 0 && !hasError

  const canNext = installed
    ? stepIndex < 3
    : stepIndex === 0
    ? allChecksOk
    : stepIndex === 1
    ? true
    : stepIndex === 2
    ? !!form.site_name && !!form.site_domain && !!form.admin_username && !!form.admin_email && form.admin_password.length >= 8
    : stepIndex < 3

  function nextStep() {
    if (stepIndex < steps.length - 1 && canNext) setStepIndex(stepIndex + 1)
  }

  function prevStep() {
    if (stepIndex > 0 && !installed) {
      setStepIndex(stepIndex - 1)
    } else if (stepIndex === 0) {
      setAgreementAccepted(false)
    }
  }

  const progress = ((stepIndex + 1) / steps.length) * 100

  return (
    <main className="install-page">
      {toastVisible && (
        <div className={`install-toast ${toastTone}`}>
          {statusMsg}
        </div>
      )}

      {!agreementAccepted ? (
        <section className="install-card install-hero install-agreement">
          <div className="agreement-logo">
            <span className="brand-logo">
              <img src="/logo.png" alt="" width={48} height={48} className="brand-logo-img" />
              <span>MXStore</span>
            </span>
          </div>

          <article className="agreement-article" ref={agreementRef} onScroll={onAgreementScroll}>
            <div className="kicker">安装许可与隐私政策</div>
            <h1>使用前请阅读并同意协议</h1>
            <p>
              MXStore（MXstoreCMS）是一个应用商店内容管理系统。程序、界面、文档、部署方案以及相关服务能力均受法律保护，未经 Maishan Inc.
              明确授权，将本程序用于商业销售、转售、二次分发、商业托管、付费代建或其他商业化获利行为，均可能构成侵权。
            </p>
            <p>
              为保障程序稳定运行、异常排查、授权合规和服务质量，安装并使用本程序即表示你同意我们在必要范围内收集并上传当前部署环境的域名、IP 地址、设备与运行环境信息。
              这些信息仅用于安全风控、稳定性分析、兼容性判断和授权管理，不会作为与程序运行无关的用途。
            </p>
            <p>
              你应确保填写的管理员账号、站点信息真实、有效，并对部署环境的合法性、内容合规性、账号安全和访问权限承担责任。Maishan Inc.
              可以根据安全事件、异常访问、授权状态和版本稳定性对必要信息进行核验，以降低恶意镜像、盗版分发、批量攻击、异常采集、未授权商用和数据泄露风险。
            </p>
            <p>
              本程序会在安装过程中写入数据库安装状态、管理员账号、站点配置。安装完成后，系统将依据你配置的信息进行访问控制。
              你不得移除、绕过、隐藏或篡改授权声明、版权声明、隐私提示和安全校验逻辑，也不得将本程序包装为未经授权的商业产品向第三方销售。
            </p>
            <p>
              如果你不同意上述许可与隐私条款，请停止安装并删除本程序。继续安装表示你已阅读、理解并同意本协议及隐私政策。
            </p>
            <p>
              请继续向下滚动并完整阅读本协议。只有当你滚动到协议正文底部后，安装程序才会允许点击&ldquo;我同意此协议&rdquo;。点击同意后，系统会进入初始化安装流程。
            </p>
          </article>

          <button
            type="button"
            className="btn-primary agreement-accept"
            disabled={!agreementRead}
            onClick={() => setAgreementAccepted(true)}
          >
            {agreementRead ? '我同意此协议' : '阅读到底部后可同意'}
          </button>
        </section>
      ) : (
        <div className="install-shell">
          <div className="step-grid step-grid-outside">
            {steps.map((step, i) => (
              <button
                key={step.title}
                type="button"
                className={`step ${i === stepIndex ? 'active' : ''} ${i < stepIndex || installed ? 'done' : ''}`}
                disabled={installed || i > stepIndex + 1}
                onClick={() => { if (!installed && i <= stepIndex + 1) setStepIndex(i) }}
              >
                <strong>{String(i + 1).padStart(2, '0')}</strong>
                <span>{step.title}</span>
              </button>
            ))}
          </div>

          <section className="install-card install-hero install-wizard">
            {/* Centered brand logo */}
            <div className="install-heading">
              <span className="brand-logo brand-logo-centered">
                <img src="/logo.png" alt="" width={36} height={36} className="brand-logo-img" />
                <span>MXStore</span>
              </span>
            </div>

            <div className="install-step-page">
              <div className="install-step-title">
                <h2>{steps[stepIndex].title}</h2>
              </div>

              {stepIndex === 0 && (
                <section className="install-section">
                  <div className="check-list">
                    {envChecks.map((item) => (
                      <div key={item.name} className="check-row">
                        {item.status === 'ok' ? (
                          <svg className="check-icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : item.status === 'warning' ? (
                          <svg className="check-icon warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.1 14A2 2 0 004 21h16a2 2 0 001.81-3.14l-8.1-14a2 2 0 00-3.42 0z" /></svg>
                        ) : (
                          <svg className="check-icon info" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4m0 4h.01" /></svg>
                        )}
                        <div><strong>{item.name}</strong><small>{item.message}</small></div>
                      </div>
                    ))}
                  </div>
                  {hasError && (
                    <p className="check-hint">存在错误项，请修复后再进行下一步。</p>
                  )}
                </section>
              )}

              {stepIndex === 1 && (
                <section className="install-section install-section-with-action">
                  <div className="install-section-body">
                    <div className="grid single">
                      <label>数据库类型<input value="Supabase Cloud" readOnly /></label>
                      <label>连接状态<input value="通过环境变量自动连接" readOnly /></label>
                      <label>Supabase URL<input value={process.env.NEXT_PUBLIC_SUPABASE_URL ? '已配置' : '未配置'} readOnly /></label>
                      <label>Service Role Key<input value={process.env.SUPABASE_SERVICE_ROLE_KEY ? '已配置' : '未配置'} type="password" readOnly /></label>
                    </div>
                  </div>
                  <aside className="install-side-actions">
                    <button type="button" disabled>自动连接</button>
                  </aside>
                </section>
              )}

              {stepIndex === 2 && (
                <section className="install-section">
                  <form id="install-form" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid single">
                      <label>站点名称
                        <input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} disabled={installed} />
                      </label>
                      <label>域名
                        <input value={form.site_domain} onChange={(e) => setForm({ ...form, site_domain: e.target.value })} disabled={installed} placeholder="https://your-domain.com" />
                      </label>
                      <label>管理员
                        <input value={form.admin_username} onChange={(e) => setForm({ ...form, admin_username: e.target.value })} disabled={installed} />
                      </label>
                      <label>邮箱
                        <input type="email" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} disabled={installed} />
                      </label>
                      <label>密码
                        <input type="password" value={form.admin_password} onChange={(e) => setForm({ ...form, admin_password: e.target.value })} disabled={installed} placeholder="至少 8 位" />
                      </label>
                    </div>
                    <p className="form-hint">密码至少 8 位。安装完成后可登录后台修改。</p>
                  </form>
                </section>
              )}

              {stepIndex === 3 && (
                <section className={`install-section command-stage ${installed ? 'complete' : ''}`}>
                  {!installed ? (
                    <div className="command-box">
                      {[
                        { text: `mxstore env:check --supabase=${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ok' : 'pending'}`, done: true },
                        { text: `mxstore migrate --apply`, done: true },
                        { text: `mxstore admin:create --user="${form.admin_username}" --email="${form.admin_email}"`, done: !!installResult },
                        { text: `mxstore settings:init --site="${form.site_name}" --domain="${form.site_domain}"`, done: !!installResult },
                        { text: installed ? 'mxstore install:lock --status=installed' : 'mxstore install:lock --status=pending', done: installed }
                      ].map((line, i) => (
                        <div key={i} className={`command-line ${line.done ? 'done' : installing && !line.done ? 'running' : ''}`}>
                          <span>{line.done ? 'done' : installing ? 'run' : 'wait'}</span>
                          <code>{line.text}</code>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="install-complete">
                      <div className="fireworks" aria-hidden="true">
                        {Array.from({ length: 18 }, (_, i) => (
                          <span key={i} style={{ '--i': String(i + 1) } as React.CSSProperties} />
                        ))}
                      </div>
                      <h2>安装完成</h2>
                      <p>初始化数据已写入，管理员账号已创建。</p>
                      <a className="button-link" href="/login">进入登录页面</a>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Navigation */}
            <div className="install-nav">
              <button type="button" className="btn-outline" disabled={installed} onClick={prevStep}>上一步</button>
              <div className="nav-right">
                {stepIndex === 0 && (
                  <button type="button" className="btn-outline" disabled={checking} onClick={checkStatus}>{checking ? '检测中...' : '重新检测'}</button>
                )}
                {stepIndex < 3 ? (
                  <button type="button" className="btn-primary" disabled={!canNext} onClick={nextStep}>下一步</button>
                ) : !installed ? (
                  <button type="button" className="btn-primary" disabled={installing || installed} onClick={() => { void runInstall() }}>
                    {installing ? '安装中...' : '开始安装'}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="install-progress install-progress-bottom">
              <span style={{ width: `${progress}%` }} />
            </div>

            <footer className="install-copyright">Copyright &copy; 2026 Maishan Inc. &amp; MXStore. All rights reserved.</footer>
          </section>
        </div>
      )}

      <style jsx global>{`
        .install-page {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 30px;
          background: #f8fafc;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .install-page * { box-sizing: border-box; }

        /* Toast */
        .install-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 100;
          padding: 14px 22px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #1e293b;
          font-size: 14px;
          box-shadow: 0 16px 40px rgba(0,0,0,.08);
          animation: toastIn .22s ease;
        }
        .install-toast.warning { border-color: rgba(251,191,36,.45); color: #b45309; }
        .install-toast.success { border-color: #d1fae5; color: #047857; }

        .install-shell { width: min(860px, 100%); }

        .install-card {
          border: 1px solid #e2e8f0;
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 1px 3px rgba(0,0,0,.04);
        }

        /* Agreement */
        .install-agreement {
          display: grid;
          justify-items: center;
          text-align: center;
          gap: 22px;
          padding: 34px 34px 38px;
          width: min(720px, 100%);
        }
        .agreement-logo .brand-logo { font-size: 32px; gap: 12px; }
        .agreement-logo .brand-logo-img { width: 48px; height: 48px; }
        .agreement-article {
          max-width: 680px;
          max-height: 320px;
          overflow-y: auto;
          display: grid;
          gap: 10px;
          padding-right: 8px;
        }
        .agreement-article::-webkit-scrollbar { width: 4px; }
        .agreement-article::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
        .agreement-article::-webkit-scrollbar-track { background: transparent; }
        .agreement-article h1 { margin: 6px 0 4px; font-size: 32px; color: #000000; font-weight: 700; }
        .agreement-article p { margin: 0; line-height: 1.8; text-align: left; color: #64748b; font-size: 14px; }
        .agreement-accept { min-width: 210px; }

        /* Brand logo */
        .brand-logo {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #0f172a;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: .04em;
        }
        .brand-logo-img { border-radius: 8px; object-fit: contain; }
        .brand-logo-centered { justify-content: center; width: 100%; }

        /* Kicker */
        .kicker {
          color: #000000;
          text-transform: uppercase;
          letter-spacing: .14em;
          font-size: 12px;
          font-weight: 700;
        }

        /* Step grid */
        .step-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin: 22px 0 14px;
        }
        .step-grid-outside { width: 100%; margin: 0 0 12px; }
        .step {
          border: 0;
          border-bottom: 2px solid #e2e8f0;
          border-radius: 0;
          padding: 0 0 12px;
          background: transparent;
          color: #94a3b8;
          display: grid;
          gap: 4px;
          text-align: left;
          cursor: pointer;
          font-size: 14px;
          transition: all .2s;
        }
        .step strong { color: #94a3b8; letter-spacing: .12em; font-size: 12px; }
        .step.active { border-color: #0f172a; color: #0f172a; }
        .step.active strong { color: #047857; }
        .step.done { border-color: #cbd5e1; color: #64748b; }
        .step:disabled { cursor: default; }

        /* Install heading */
        .install-hero { position: relative; overflow: hidden; }
        .install-heading {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          min-height: 50px;
        }
        .install-heading .brand-logo { font-size: 26px; gap: 10px; }
        .install-heading .brand-logo-img { width: 36px; height: 36px; }

        /* Step page */
        .install-step-page { margin-top: 24px; min-height: 382px; }
        .install-step-title { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .install-step-title h2 { margin: 0; color: #0f172a; font-size: 20px; font-weight: 600; }
        .install-section { padding-top: 6px; }
        .install-section-with-action {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 174px;
          gap: 18px;
          align-items: start;
        }
        .install-side-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 12px;
        }
        .install-side-actions button { width: 100%; }

        /* Check list */
        .check-list { display: grid; gap: 10px; margin: 12px 0 18px; }
        .check-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .check-row:last-child { border-bottom: 0; }
        .check-row strong { display: block; color: #0f172a; font-size: 14px; }
        .check-row small { display: block; color: #94a3b8; font-size: 12px; margin-top: 2px; }
        .check-icon { width: 20px; height: 20px; flex-shrink: 0; margin-top: 1px; }
        .check-icon.success { color: #047857; }
        .check-icon.warning { color: #d97706; }
        .check-icon.info { color: #94a3b8; }
        .check-hint { color: #b45309; font-size: 13px; margin-top: 8px; }

        /* Grid */
        .grid.single { display: grid; grid-template-columns: 1fr; gap: 18px; }
        .grid.single label {
          display: grid;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #475569;
        }
        .grid.single input, .install-section input {
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #ffffff;
          color: #0f172a;
          font-size: 14px;
          outline: none;
          transition: border-color .2s;
        }
        .grid.single input:focus, .install-section input:focus { border-color: #3b82f6; }
        input[readonly] { color: #94a3b8; border-color: #f1f5f9; background: #f8fafc; }
        .form-hint { color: #94a3b8; font-size: 12px; margin-top: 12px; }

        /* Command stage */
        .command-stage { min-height: 300px; display: grid; align-items: center; }
        .command-box {
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #f8fafc;
          padding: 28px;
          display: grid;
          gap: 12px;
        }
        .command-line {
          display: grid;
          grid-template-columns: 54px minmax(0, 1fr);
          gap: 12px;
          align-items: center;
          color: #94a3b8;
        }
        .command-line span {
          text-transform: uppercase;
          font-size: 11px;
          letter-spacing: .12em;
          text-align: right;
        }
        .command-line code {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 13px;
          background: transparent;
          color: #94a3b8;
        }
        .command-line.done, .command-line.done code { color: #0f172a; }
        .command-line.running code::after {
          content: "";
          display: inline-block;
          width: 8px;
          height: 16px;
          background: #0f172a;
          margin-left: 4px;
          animation: caret 1s steps(1) infinite;
          vertical-align: text-bottom;
        }

        /* Complete */
        .install-complete { text-align: center; padding: 40px 0; }
        .install-complete h2 { font-size: 24px; color: #0f172a; margin: 0 0 8px; }
        .install-complete p { color: #64748b; margin: 0 0 24px; }
        .button-link {
          display: inline-block;
          padding: 12px 32px;
          background: #0f172a;
          color: #ffffff;
          border-radius: 10px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: background .2s;
        }
        .button-link:hover { background: #1e293b; }

        /* Fireworks */
        .fireworks { position: relative; width: 120px; height: 120px; margin: 0 auto 24px; }
        .fireworks span {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #047857;
          animation: firework 1.2s ease-out calc(var(--i) * 0.06s) both;
        }

        /* Buttons */
        .btn-primary {
          background: #0f172a;
          border: 1px solid #0f172a;
          color: #ffffff;
          padding: 9px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all .2s;
        }
        .btn-primary:hover { background: #1e293b; }
        .btn-primary:disabled { opacity: .4; cursor: default; }

        .btn-outline {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 9px 18px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all .2s;
        }
        .btn-outline:hover { background: #f8fafc; border-color: #cbd5e1; }
        .btn-outline:disabled { opacity: .4; cursor: default; }

        .install-side-actions button {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 9px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all .2s;
        }
        .install-side-actions button:hover { background: #f8fafc; }
        .install-side-actions button:disabled { opacity: .4; cursor: default; }

        /* Nav */
        .install-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-top: 18px;
          padding: 0 8px;
        }
        .nav-right { display: flex; gap: 10px; align-items: center; }

        /* Progress */
        .install-progress {
          height: 6px;
          border-radius: 999px;
          background: #f1f5f9;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .install-progress span {
          display: block;
          height: 100%;
          background: #0f172a;
          transition: width .24s ease;
        }
        .install-progress-bottom {
          position: absolute;
          left: -1px;
          right: -1px;
          bottom: 0;
          border: 0;
          border-radius: 0 0 24px 24px;
        }

        /* Copyright */
        .install-copyright {
          position: absolute;
          left: 20px;
          right: 20px;
          bottom: 14px;
          font-size: 11px;
          color: #000000;
          text-align: center;
          pointer-events: none;
        }

        /* Wizard */
        .install-wizard { padding: 32px 40px 54px; }

        /* Animations */
        @keyframes caret { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes firework {
          0% { transform: translate(-50%, -50%) rotate(calc(var(--i) * 20deg)) translateY(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(calc(var(--i) * 20deg)) translateY(-60px); opacity: 0; }
        }
        @keyframes toastIn { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </main>
  )
}
