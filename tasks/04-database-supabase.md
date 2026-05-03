# 04 Supabase 数据库与 RLS

## 1. 核心表

- `store_users`
- `apps`
- `app_download_links`
- `token_domains`
- `traffic_packages`
- `orders`
- `payments`
- `app_entitlements`
- `traffic_wallets`
- `traffic_ledger`
- `download_logs`

## 2. 权限模型

用户角色：

- `user`
- `admin`

## 3. RLS 原则

Supabase Cloud 必须启用 Row Level Security。

普通用户只能访问自己的：

- 订单
- 支付记录
- 流量钱包
- 流量流水
- 下载记录
- 应用权益

管理员可以访问全部后台数据。

## 4. 迁移要求

所有数据库结构变化必须写入：

```txt
supabase/migrations/
```

禁止只在 Supabase Dashboard 手动改表而不提交迁移文件。

## 5. Token 存储

`token_domains.admin_token_ciphertext` 必须存加密后的 Token。

不得明文存储 OpenList 管理员 Token。
