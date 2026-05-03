# AGENTS.md — MXstoreCMS 开发规范

本文件是 **MXStore / MXstoreCMS** 项目的长期开发规则。任何 AI Agent、自动化脚本或开发者在修改本仓库时，都必须遵守本规范。

## 1. 项目身份

- 产品名称：**MXStore**
- 项目名称：**MXstoreCMS**
- 技术栈：Next.js App Router + React + TypeScript + Supabase Cloud + Tailwind CSS
- 部署目标：Vercel
- 数据与认证：Supabase Cloud
- 下载源：OpenList 签名下载 + 外部官网下载链接
- 支付方式：第三方登录、钱包插件登录、链上付款

## 2. 产品目标

MXstoreCMS 是一个数字应用商店后台与用户系统，支持：

1. 管理员上架应用。
2. 一个应用创建多个下载链接。
3. 下载链接可以是 OpenList `/p/...` 链接，也可以是外部官网链接。
4. 系统根据下载链接域名自动匹配管理员预设的 OpenList Token。
5. 后端临时生成 OpenList `/d/...?...sign=` 下载链接。
6. 用户可以购买流量套餐。
7. 应用可以设置免费或付费。
8. 支持钱包浏览器插件登录。
9. 支持 Supabase 第三方 OAuth 登录。
10. 支持区块链付款。
11. 最终部署到 Vercel，并使用云端 Supabase。

## 3. UI/UX 设计规范

### 3.1 总体风格

后台必须保持：

- 简洁
- 纯色
- 白色为主
- 低饱和
- SaaS 管理后台风格
- 大留白
- 轻边框
- 轻阴影
- 清晰层级

禁止：

- 大面积渐变背景
- 复杂纹理
- 过度拟物化
- 多色混杂
- 强烈霓虹色
- 暗黑主题作为默认后台

### 3.2 颜色规则

推荐：

- 页面背景：`#FFFFFF` 或 `#F8FAFC`
- 主文字：`#0F172A`
- 次级文字：`#64748B`
- 边框：`#E2E8F0`
- 卡片背景：`#FFFFFF`
- 主品牌色：蓝色系，例如 `#2563EB`

状态颜色只用于小面积标签：

- 成功：绿色
- 警告：橙色
- 错误：红色
- 信息：蓝色

### 3.3 后台布局

后台默认结构：

```txt
左侧 Sidebar
顶部 Header
主内容区 Main
```

必须包含的导航：

- 仪表盘
- 应用管理
- 下载链接
- 域名与 Token
- 流量套餐
- 订单支付
- 用户管理
- 数据统计
- 系统设置

### 3.4 组件风格

卡片：

- 白底
- 圆角
- 轻边框
- 轻阴影或无阴影
- 内边距充足

表格：

- 清晰表头
- 行高舒适
- 状态使用小标签
- 操作使用图标按钮或轻量按钮

表单：

- 标签明确
- 错误信息靠近字段
- 必填项清晰标识
- 不要在前端展示 OpenList 管理员 Token 明文

## 4. 代码规范

### 4.1 TypeScript

- 必须使用 TypeScript。
- 禁止使用 `any`，除非有明确注释说明原因。
- API 输入必须校验。
- 数据库返回值应尽量有类型定义。

### 4.2 Next.js

- 使用 App Router。
- 页面放在 `app/`。
- API 使用 Route Handlers，放在 `app/api/.../route.ts`。
- 服务端敏感逻辑不得放到 Client Component。
- 涉及 Token、支付验证、下载签名的代码必须只在服务端运行。

### 4.3 Supabase

- 客户端读取使用 anon key。
- 管理操作使用 service role key，但必须只在服务端使用。
- 必须启用 RLS。
- 普通用户只能读取自己的订单、流量、下载记录和权益。
- 管理员接口必须做 role 检查。

### 4.4 OpenList

OpenList 签名逻辑必须遵守：

```txt
to_sign = openlistPath + ":" + expireTimestamp
sign = safeBase64(HMAC-SHA256(to_sign, adminToken)) + ":" + expireTimestamp
```

注意：

- 签名路径必须是 OpenList 内部路径，例如 `/one/文件名.mkv`。
- 不要使用完整 URL 参与签名。
- 不要使用 `/p` 或 `/d` 前缀参与签名。
- 前端不得接触管理员 Token。
- Token 按域名匹配，例如 `oss-us-hk.smvapi.store`。

### 4.5 下载次数与流量

- 下载次数、流量余额、订单状态必须由后端数据库控制。
- 不要依赖 OpenList 的 sign 实现下载次数限制。
- 浏览器、下载器可能发起 Range 请求，不要按 HTTP 请求次数计费。
- 推荐以“用户点击下载并生成下载会话”为一次计费点。
- 扣流量必须使用事务或数据库函数，避免并发绕过。

### 4.6 支付

- 钱包支付必须后端验证交易。
- 不能信任前端传入的金额、收款地址、chainId。
- 交易 hash 必须幂等，不能重复入账。
- 支持 native token 与 ERC20 时要分开验证。
- 未确认交易不得直接发放权益，除非产品明确允许。

## 5. 文件结构约定

推荐结构：

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
```

## 6. 环境变量规范

必须使用 `.env.local`，不得提交真实密钥。

示例变量：

```txt
NEXT_PUBLIC_APP_NAME=MXStore
NEXT_PUBLIC_APP_URL=https://你的域名
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENLIST_TOKEN_ENCRYPTION_KEY=
SIWE_SESSION_SECRET=
RPC_URL_ETHEREUM=
RPC_URL_BASE=
RPC_URL_BSC=
```

## 7. 安全红线

严禁：

1. 把 Supabase service role key 暴露给浏览器。
2. 把 OpenList 管理员 Token 暴露给浏览器。
3. 前端直接计算 OpenList sign。
4. 前端自行判断支付成功并发放权益。
5. 关闭 RLS 后上线。
6. 将真实私钥、助记词、API Key 提交到 Git。
7. 在日志中打印完整 Token、service key、钱包签名原文。

## 8. 开发流程

每次开发必须按以下顺序：

1. 阅读 `tasks/` 中对应任务文档。
2. 明确涉及的数据表、API、页面、权限。
3. 先改数据库迁移或类型。
4. 再写服务端逻辑。
5. 再写前端页面。
6. 最后补充测试和文档。
7. 本地验证后再部署。

## 9. Git 提交规范

提交信息建议：

```txt
feat(admin): add app creation form
feat(download): add openlist signed redirect
fix(auth): validate wallet nonce
docs(tasks): update vercel deployment checklist
```

## 10. 最终验收目标

上线前必须完成：

- 管理员可创建应用。
- 管理员可创建多个下载链接。
- 管理员可配置域名与 Token。
- 用户可登录。
- 用户可钱包登录。
- 用户可购买流量套餐。
- 用户可购买付费应用。
- 用户可下载免费/已购应用。
- OpenList 链接无 sign 无法下载。
- 有效 sign 可以下载。
- 过期 sign 无法下载。
- Vercel 部署成功。
- Supabase Cloud RLS 生效。
