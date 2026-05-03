# 00 项目简报

## 项目名称

**MXstoreCMS**

## 产品名称

**MXStore**

## 一句话说明

MXStore 是一个支持 OpenList 签名下载、流量套餐、付费应用、钱包登录、第三方登录和链上支付的应用商店系统。

## 技术栈

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase Cloud
- Supabase Auth
- Supabase Postgres
- Vercel
- EVM Wallet / SIWE
- OpenList signed download

## 核心场景

管理员：

1. 登录后台。
2. 配置 OpenList 域名与管理员 Token。
3. 创建应用。
4. 给一个应用添加多个下载链接。
5. 设置应用免费或付费。
6. 创建流量套餐。
7. 查看订单、用户、下载记录。

用户：

1. 使用第三方登录或钱包登录。
2. 浏览应用。
3. 购买流量套餐。
4. 购买付费应用。
5. 下载应用。
6. 查看下载记录和流量余额。

## 最终部署目标

- 前端与 API：Vercel
- 数据库、认证、RLS：Supabase Cloud
