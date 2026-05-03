# MXStore

> 项目名称 MXstore-CMS · 产品名称 MXStore

快速的使用Vercel+Supabase部署MXStore 
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Maishan-Inc/MXstore-CMS)

应用商店 CMS 与签名下载管理系统。基于 Next.js App Router + Supabase Cloud + Tailwind CSS 构建，支持 OpenList 签名下载、钱包登录、链上支付。

## 功能特性

**应用管理**
- 管理员上架应用，支持免费 / 付费模式
- 一个应用可创建多个下载链接
- 支持 OpenList 链接和外部官网链接

**OpenList 签名下载**
- 输入 `/p/...` 链接自动解析域名和路径
- 按域名自动匹配管理员 Token
- 后端生成临时签名下载 URL
- 流量按下载会话扣减，支持原子化操作

**用户系统**
- Supabase OAuth 第三方登录（GitHub / Google）
- 钱包浏览器插件登录（SIWE 风格）
- 流量套餐购买与余额管理
- 下载记录和流量明细

**区块链支付**
- 支持 Ethereum / Base / BSC 链
- 原生币和 ERC20 代币支付
- 链上交易验证，幂等防重复

**管理后台**
- 仪表盘数据概览
- 应用、下载链接、域名 Token 管理
- 流量套餐、订单、用户管理
- 数据统计与分析

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15 App Router |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 数据库 | Supabase Postgres |
| 认证 | Supabase Auth + SIWE |
| 区块链 | viem + RainbowKit |
| 验证 | zod |
| 测试 | vitest |
| 部署 | Vercel + Supabase Cloud |

## 快速开始

### 1. 创建 Supabase 项目

前往 [Supabase](https://supabase.com) 创建一个新项目，获取以下信息：
- Project URL
- Anon Key
- Service Role Key

### 2. 执行数据库迁移

在 Supabase Dashboard → SQL Editor 中，按顺序执行以下迁移文件：

1. `supabase/migrations/0001_schema.sql` — 基础表结构
2. `supabase/migrations/0002_atomic_deduction.sql` — 原子化流量扣减
3. `supabase/migrations/0003_system_settings.sql` — 系统设置表

### 3. 部署到 Vercel

点击上方按钮或访问 [Vercel](https://vercel.com/new/clone?repository-url=https://github.com/Maishan-Inc/MXstore-CMS) 直接部署。

部署时需要填写以下环境变量：

| 变量 | 说明 | 必填 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | 是 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | 是 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | 是 |
| `APP_SECRET` | 加密密钥（任意随机字符串） | 是 |
| `NEXT_PUBLIC_APP_URL` | 站点域名，如 `https://your-domain.com` | 否 |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect 项目 ID | 否 |
| `EVM_RPC_URL_8453` | Base 链 RPC（支付功能需要） | 否 |

### 4. 运行安装向导

部署完成后访问首页，自动跳转到安装向导：
1. 阅读并同意安装协议
2. 环境检测（Supabase 连接、Node/Next 版本、数据库表）
3. 数据库连接确认
4. 创建管理员账号
5. 完成安装

## 本地开发

```bash
pnpm install
cp .env.example .env.local
# 编辑 .env.local 填写 Supabase 配置
pnpm dev
```

打开 http://localhost:3000，首次访问会自动进入安装向导。

> **注意：** 本地开发同样需要先在 Supabase 中执行数据库迁移。

## 环境变量

```bash
# 应用
NEXT_PUBLIC_APP_NAME=MXStore
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Cloud
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# 加密密钥
APP_SECRET=

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

# 区块链 RPC
EVM_RPC_URL_1=          # Ethereum
EVM_RPC_URL_8453=       # Base
EVM_RPC_URL_56=         # BSC
```

## 项目结构

```
app/
  admin/              # 管理后台页面
  dashboard/          # 用户后台页面
  api/                # API 路由
  install/            # 安装向导
  login/              # 登录页
  app/[slug]/         # 应用详情页
components/           # React 组件
lib/                  # 工具库
  openlist.ts         # OpenList 签名逻辑
  crypto.ts           # 加密工具
  payments.ts         # 区块链支付验证
  supabase/           # Supabase 客户端
supabase/migrations/  # 数据库迁移
tests/                # 单元测试
```

## Logo

将 logo 文件放在 `public/logo.png`（推荐 512x512 正方形 PNG）。

## 开发文档

- [AGENTS.md](AGENTS.md) — 开发规范
- [CLAUDE.md](CLAUDE.md) — Claude 开发指南
- [tasks/](tasks/) — 任务清单与设计文档

## 许可
未经Maishan Inc.或中国大陆代理公司运行禁止使用此项目进行任何的商业行盈利.
Copyright 2026 Maishan Inc. & MXStore. All rights reserved.
