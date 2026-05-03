# 08 登录系统：钱包登录与第三方登录

## 1. Supabase OAuth

支持：

- Google
- GitHub
- 其他 Supabase 支持的 Provider

流程：

1. 前端调用 Supabase OAuth。
2. Supabase 完成回调。
3. 中间件刷新 session。
4. 创建或更新 `store_users`。

## 2. 钱包登录

采用 SIWE 风格流程：

1. 前端连接钱包。
2. 请求后端生成 nonce。
3. 前端请求钱包签名。
4. 后端验证签名。
5. 绑定或创建用户。
6. 建立会话。

## 3. 钱包绑定

用户可在 `/account/settings` 绑定钱包。

一个用户可扩展支持多个钱包，但首期可以先支持一个主钱包。

## 4. 安全要求

- nonce 一次性使用。
- nonce 设置过期时间。
- 签名必须后端验证。
- wallet address 统一小写保存。
- 登录行为写入审计日志。
