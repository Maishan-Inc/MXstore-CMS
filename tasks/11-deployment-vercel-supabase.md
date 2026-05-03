# 11 部署：Vercel + Supabase Cloud

## 1. Supabase Cloud 准备

1. 创建 Supabase Cloud 项目。
2. 记录 Project URL。
3. 记录 anon key。
4. 记录 service role key。
5. 记录 Postgres 连接字符串，作为 Vercel 服务端环境变量 `SUPABASE_DB_URL`。
6. 配置 Auth Provider。
7. 配置 Site URL 和 Redirect URLs。

## 2. Vercel 准备

1. 项目推送到 GitHub。
2. 登录 https://vercel.com。
3. Import Project。
4. 选择 MXstoreCMS 仓库。
5. Framework 使用 Next.js。
6. 配置环境变量。
7. Deploy。

## 3. Vercel 环境变量

至少配置：

```txt
NEXT_PUBLIC_APP_NAME=MXStore
NEXT_PUBLIC_APP_URL=https://你的域名
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
OPENLIST_TOKEN_ENCRYPTION_KEY=
SIWE_SESSION_SECRET=
RPC_URL_ETHEREUM=
RPC_URL_BASE=
RPC_URL_BSC=
```

## 4. 部署后初始化

1. 访问线上域名，进入安装向导。
2. 填写站点与管理员信息。
3. 点击开始安装，系统会使用 `SUPABASE_DB_URL` 自动执行数据库迁移。
4. 安装完成后使用管理员账号登录。
5. 进入后台。
6. 创建 OpenList 域名配置。
7. 创建流量套餐。
8. 创建第一个应用。
9. 测试下载。

## 5. 部署后验收

- 首页正常访问。
- 登录正常。
- 管理后台正常。
- Supabase 数据读写正常。
- Vercel API Route 正常。
- OpenList sign 正常。
- 链上支付验证正常。
