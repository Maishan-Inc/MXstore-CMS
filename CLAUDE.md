# CLAUDE.md — MXstoreCMS Claude 开发指南

本文件用于让 Claude / Claude Code 理解并长期遵守 **MXStore / MXstoreCMS** 项目的开发规则。  
修改本仓库前，请先读取本文件、`AGENTS.md` 和 `tasks/` 目录。

---

## 1. 项目身份

- 产品名称：**MXStore**
- 项目名称：**MXstoreCMS**
- 包名：`mxstorecms`
- 类型：应用商店 CMS + 用户下载系统
- 默认语言：中文
- 默认后台风格：**简洁、纯色、白色、现代 SaaS 管理后台**

技术栈：

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase Cloud
- Supabase Auth
- Supabase Postgres
- Supabase RLS
- Vercel
- OpenList signed download
- EVM 钱包登录 / SIWE 风格登录
- 区块链支付

---

## 2. Claude 工作方式

Claude 在本项目中应按以下方式工作：

1. 先理解需求，再修改代码。
2. 涉及任务流程时，优先查看 `tasks/`。
3. 涉及全局规范时，优先查看 `AGENTS.md`。
4. 涉及部署时，查看 `tasks/11-deployment-vercel-supabase.md`。
5. 涉及最终验收时，查看 `tasks/12-final-acceptance.md`。
6. 修改敏感逻辑前，先确认是否涉及：
   - OpenList 管理员 Token
   - Supabase service role key
   - 钱包签名
   - 链上支付
   - 用户余额
   - 付费应用权益
   - 下载扣费
7. 修改后必须保持 TypeScript 类型正确。
8. 不要把密钥写入代码。
9. 不要把服务端敏感逻辑移动到 Client Component。
10. 不要破坏白色极简后台风格。

---

## 3. 项目核心目标

MXstoreCMS 要实现：

- 管理员后台上架应用。
- 一个应用可以创建多个下载链接。
- 下载链接可以是 OpenList 链接，也可以是外部官网链接。
- 创建应用时输入 OpenList `/p/...` 链接，系统自动解析域名和真实路径。
- 系统根据域名匹配后台配置的 OpenList 管理员 Token。
- 用户下载时由后端临时生成 OpenList `/d/...?...sign=` 链接。
- 用户可以通过第三方登录。
- 用户可以通过钱包浏览器插件登录。
- 用户可以购买流量套餐。
- 管理员可以设置应用免费或付费。
- 用户可以链上付款购买套餐或应用。
- 最终部署到 Vercel，并使用 Supabase Cloud。

---

## 4. 目录理解

推荐目录结构：

```txt
app/
  admin/
  account/
  api/
components/
  admin/
  app-store/
  auth/
  layout/
lib/
  openlist.ts
  supabase/
  auth/
  payments/
  validators/
supabase/
  migrations/
tasks/
  *.md
AGENTS.md
CLAUDE.md
```

### 重要文件

- `lib/openlist.ts`：OpenList URL 解析、域名匹配、签名生成、下载 URL 生成。
- `app/api/download/[linkId]/route.ts`：下载权限校验、流量扣减、下载日志、302 跳转。
- `supabase/migrations/`：数据库结构和 RLS 策略。
- `tasks/05-openlist-download-system.md`：OpenList 下载系统任务说明。
- `tasks/11-deployment-vercel-supabase.md`：Vercel + Supabase Cloud 部署流程。

---

## 5. UI 设计要求

后台界面必须遵守：

- 白色为主。
- 纯色风格。
- 简洁布局。
- 低饱和状态色。
- 轻边框。
- 轻阴影。
- 大留白。
- SaaS 管理后台风格。

禁止默认使用：

- 暗黑后台。
- 大面积渐变。
- 花哨纹理。
- 霓虹色。
- 复杂背景图。
- 过度动画。

### 后台导航必须包含

- 仪表盘
- 应用管理
- 下载链接
- 域名与 Token
- 流量套餐
- 订单支付
- 用户管理
- 数据统计
- 系统设置

### 后台首页建议区块

- 应用总数
- 今日下载
- 付费订单
- 活跃用户
- 应用列表
- 下载配置概览
- 最近订单

设计参考图位置：

```txt
tasks/assets/mxstore-admin-white-dashboard.png
```

---

## 6. OpenList 签名下载规则

这是本项目的关键逻辑。

### 6.1 输入示例

管理员可能输入：

```txt
http://oss-us-hk.smvapi.store/p/one/%E7%BD%97%E5%B0%8F%E9%BB%91%E6%88%98%E8%AE%B0/2025.2160p.WEB-DL.H265.HQ.DV.DTS5.1.mkv
```

系统应解析：

```txt
domain = oss-us-hk.smvapi.store
openlistPath = /one/罗小黑战记/2025.2160p.WEB-DL.H265.HQ.DV.DTS5.1.mkv
```

最终生成下载链接：

```txt
http://oss-us-hk.smvapi.store/d/one/%E7%BD%97%E5%B0%8F%E9%BB%91%E6%88%98%E8%AE%B0/2025.2160p.WEB-DL.H265.HQ.DV.DTS5.1.mkv?sign=...
```

### 6.2 签名算法

签名时只使用 OpenList 内部路径：

```txt
to_sign = openlistPath + ":" + expireTimestamp
signature = safeBase64(HMAC-SHA256(to_sign, adminToken))
sign = signature + ":" + expireTimestamp
```

注意：

- 不要使用完整 URL 参与签名。
- 不要使用 `/p` 前缀参与签名。
- 不要使用 `/d` 前缀参与签名。
- 不要在前端计算 sign。
- 不要让前端接触 OpenList 管理员 Token。
- Token 必须按域名匹配。
- Token 必须加密存储或至少只在服务端读取。

### 6.3 域名匹配

当下载链接域名为：

```txt
oss-us-hk.smvapi.store
```

系统应查询：

```txt
token_domains.domain = "oss-us-hk.smvapi.store"
```

得到：

- `openlist_base_url`
- `admin_token_ciphertext`
- `sign_ttl_seconds`
- `is_active`

### 6.4 下载次数与流量

OpenList 的 `sign` 只负责：

- 无签名不能访问。
- 签名过期不能访问。

它不能可靠限制“一次性下载”。

下载次数、流量余额、付费权限必须由 MXstoreCMS 后端和 Supabase 数据库控制。

不要按 HTTP 请求次数扣费，因为浏览器和下载器可能发起 Range 请求。

推荐按“用户点击下载并创建下载会话”计费。

---

## 7. Supabase 规则

### 7.1 必须使用 Supabase Cloud

生产环境使用云端 Supabase，不使用本地数据库作为最终部署目标。

### 7.2 RLS 必须开启

普通用户只能访问自己的：

- `orders`
- `payments`
- `traffic_wallets`
- `traffic_ledger`
- `download_logs`
- `app_entitlements`
- `store_users`

管理员可以访问后台数据。

### 7.3 service role key

`SUPABASE_SERVICE_ROLE_KEY` 只能在服务端使用。

禁止：

- 暴露到浏览器。
- 放入 Client Component。
- 写入前端环境变量。
- 打印到日志。

### 7.4 数据库迁移

所有结构修改都必须放入：

```txt
supabase/migrations/
```

不要只在 Supabase Dashboard 手动改表而不提交迁移。

---

## 8. 认证规则

支持：

- Supabase OAuth
- 钱包浏览器插件登录
- 后续可扩展邮箱验证码 / Magic Link

### 钱包登录

钱包登录采用 SIWE 风格流程：

1. 前端连接钱包。
2. 后端生成 nonce。
3. 前端请求钱包签名。
4. 后端验证签名。
5. 绑定或创建用户。
6. 建立会话。

要求：

- nonce 一次性使用。
- nonce 有过期时间。
- 钱包地址统一小写保存。
- 后端验证签名。
- 不信任前端传来的“已登录”状态。

---

## 9. 区块链支付规则

支持场景：

- 购买流量套餐。
- 购买付费应用。

支持资产：

- native token
- ERC20 token

### 后端必须校验

- chainId
- tx hash
- tx 是否成功
- from 地址
- to 地址
- value / token amount
- token contract
- 订单金额
- 订单状态
- tx hash 是否已入账

### 幂等要求

`chain_id + tx_hash` 必须唯一。

同一笔交易不得重复发放：

- 流量余额
- 应用权益

### 禁止

- 禁止前端自行判断付款成功并发放权益。
- 禁止只根据用户提交的金额入账。
- 禁止不校验收款地址。
- 禁止重复 tx hash 入账。

---

## 10. 管理后台开发规则

管理员后台必须实现：

- `/admin`
- `/admin/apps`
- `/admin/apps/new`
- `/admin/apps/[id]/edit`
- `/admin/settings/domains`
- `/admin/settings/packages`
- `/admin/orders`
- `/admin/users`
- `/admin/settings`

所有 `/admin` 页面必须：

- 校验登录。
- 校验 `store_users.role = admin`。
- 非管理员禁止访问。
- 保持白色极简 UI。

---

## 11. 用户后台开发规则

用户后台建议路径：

- `/account`
- `/account/apps`
- `/account/downloads`
- `/account/traffic`
- `/account/orders`
- `/account/settings`

用户后台必须：

- 只显示当前用户数据。
- 不暴露其他用户订单。
- 不暴露管理员 Token。
- 提供流量余额、订单、下载记录、已购应用。

---

## 12. 下载接口规则

下载接口建议：

```txt
POST /api/download/[linkId]
```

或：

```txt
GET /api/download/[linkId]
```

流程：

1. 获取当前用户。
2. 查询下载链接。
3. 查询应用。
4. 确认应用已发布。
5. 如果应用付费，确认用户有 `app_entitlements`。
6. 检查流量余额。
7. 创建下载日志。
8. 扣减流量。
9. 如果是 OpenList 链接，生成签名 URL。
10. 如果是 external 链接，返回外部 URL。
11. 302 跳转。

并发风险：

- 扣流量必须原子化。
- 推荐使用数据库函数或事务。
- 不能先查余额再非原子更新余额。

---

## 13. 代码风格

### TypeScript

- 尽量不要使用 `any`。
- API 输入需要校验。
- 数据库枚举建议用 union type。
- 复杂函数要拆分。
- 敏感逻辑写测试。

### React

- 默认使用 Server Components。
- 只有交互组件使用 `"use client"`。
- 表单组件要处理 loading、error、success。
- 不在 Client Component 中读取服务端密钥。

### Tailwind

- 优先使用 Tailwind utility class。
- 组件样式保持一致。
- 不要引入复杂 UI 框架，除非项目明确决定。
- 按白色极简后台风格实现。

---

## 14. 环境变量

`.env.local` 示例：

```txt
NEXT_PUBLIC_APP_NAME=MXStore
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

OPENLIST_TOKEN_ENCRYPTION_KEY=
SIWE_SESSION_SECRET=

RPC_URL_ETHEREUM=
RPC_URL_BASE=
RPC_URL_BSC=
```

要求：

- `.env.local` 不提交。
- `.env.example` 可以提交占位变量。
- 真实 key 不写入代码。
- 生产变量在 Vercel Dashboard 配置。

---

## 15. 部署规则

最终部署目标：

- Vercel：Next.js 页面和 API
- Supabase Cloud：数据库、Auth、RLS

部署流程详见：

```txt
tasks/11-deployment-vercel-supabase.md
```

上线前必须检查：

- Supabase Cloud 项目已创建。
- 数据库迁移已执行。
- RLS 已启用。
- Vercel 环境变量已配置。
- Supabase Auth Redirect URL 已配置。
- OpenList 已开启签名。
- 管理员账号已初始化。
- OpenList 下载测试通过。
- 钱包登录测试通过。
- 链上支付验证测试通过。

---

## 16. Claude 修改代码前检查清单

每次修改前，Claude 应确认：

- 这次修改涉及前端、后端、数据库还是部署？
- 是否涉及密钥？
- 是否涉及用户余额？
- 是否涉及支付？
- 是否涉及下载签名？
- 是否涉及管理员权限？
- 是否需要新增 migration？
- 是否需要更新 `tasks/` 文档？
- 是否需要更新 `.env.example`？
- 是否需要更新最终验收清单？

---

## 17. Claude 修改代码后检查清单

修改后应检查：

- TypeScript 是否合理。
- 是否破坏白色极简 UI。
- 是否把服务端逻辑误放到客户端。
- 是否泄露 Token。
- 是否破坏 RLS 假设。
- API 错误处理是否清楚。
- 用户无权限时是否返回安全错误。
- 管理员接口是否做 role 检查。
- README / tasks 是否需要同步更新。

---

## 18. 禁止事项

严禁：

1. 把 OpenList 管理员 Token 暴露给前端。
2. 把 Supabase service role key 暴露给前端。
3. 前端计算 OpenList sign。
4. 前端直接发放流量或应用权益。
5. 关闭 RLS 后上线。
6. 不验证 tx hash 就入账。
7. 重复 tx hash 多次入账。
8. 按 HTTP Range 请求次数扣费。
9. 默认改成暗黑后台。
10. 删除 `AGENTS.md`、`CLAUDE.md` 或 `tasks/`。
11. 把真实私钥、助记词、API key、Token 提交到仓库。
12. 在日志中打印完整敏感密钥。

---

## 19. 推荐开发顺序

1. 数据库迁移与 RLS。
2. Supabase Auth 与用户模型。
3. 管理员权限系统。
4. 白色极简后台 Layout。
5. 应用管理。
6. 下载链接管理。
7. 域名与 Token 管理。
8. OpenList 签名下载。
9. 用户后台。
10. 流量套餐。
11. 钱包登录。
12. 链上支付。
13. 测试。
14. Vercel + Supabase Cloud 部署。
15. 最终验收。

---

## 20. 最终验收目标

上线时必须满足：

- 产品名称为 MXStore。
- 项目名称为 MXstoreCMS。
- 管理员后台为白色极简风格。
- 管理员可创建应用。
- 一个应用可创建多个下载链接。
- OpenList `/p/...` 链接可自动解析。
- 域名可自动匹配管理员 Token。
- 后端可生成临时签名下载链接。
- 用户可第三方登录。
- 用户可钱包登录。
- 用户可购买流量套餐。
- 用户可购买付费应用。
- 用户可下载免费应用和已购应用。
- 流量不足时禁止下载。
- 未购买付费应用时禁止下载。
- Vercel 部署成功。
- Supabase Cloud RLS 生效。
