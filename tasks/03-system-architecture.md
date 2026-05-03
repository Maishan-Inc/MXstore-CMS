# 03 系统架构

## 1. 总体架构

```txt
浏览器
  ↓
Next.js App Router 页面
  ↓
Next.js Route Handlers
  ↓
Supabase Cloud / OpenList / 区块链 RPC
```

## 2. 主要模块

### 前台

- 应用列表
- 应用详情
- 登录入口
- 支付入口

### 用户后台

- 我的应用
- 我的订单
- 我的下载
- 我的流量
- 钱包绑定

### 管理后台

- 应用管理
- 下载链接管理
- 域名与 Token
- 流量套餐
- 订单支付
- 用户管理
- 数据统计
- 系统设置

### 后端服务

- 应用 CRUD
- OpenList 签名下载
- 付费权限校验
- 流量扣减
- 支付校验
- 钱包登录

## 3. 安全边界

只允许服务端访问：

- Supabase service role key
- OpenList 管理员 Token
- Token 加密密钥
- RPC 私有配置
- 支付验证逻辑

浏览器只允许访问：

- anon key
- 公共应用数据
- 当前用户自己的数据
