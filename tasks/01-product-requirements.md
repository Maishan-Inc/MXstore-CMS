# 01 产品需求

## 1. 应用管理

每个应用包含：

- 应用名称
- 应用 slug
- 图标
- 封面
- 简介
- 详情
- 版本号
- 发布状态
- 是否付费
- 价格
- 标签
- 多个下载链接

## 2. 下载链接管理

一个应用可以有多个下载链接。

每个下载链接包含：

- 链接名称，例如“高速下载”“备用线路”“官网下载”
- 链接类型：
  - `openlist`
  - `external`
- 原始 URL
- 平台，例如 Windows / macOS / Android
- 是否主下载链接
- 排序
- 备注

## 3. OpenList 链接输入

管理员创建应用时可以输入：

```txt
http://oss-us-hk.smvapi.store/p/one/%E7%BD%97%E5%B0%8F%E9%BB%91%E6%88%98%E8%AE%B0/2025.2160p.WEB-DL.H265.HQ.DV.DTS5.1.mkv
```

系统需要自动解析：

```txt
domain = oss-us-hk.smvapi.store
openlist_path = /one/罗小黑战记/2025.2160p.WEB-DL.H265.HQ.DV.DTS5.1.mkv
```

下载时生成：

```txt
http://oss-us-hk.smvapi.store/d/one/...mkv?sign=...
```

## 4. 流量套餐

管理员可创建套餐：

- 套餐名称
- 流量大小
- 价格
- 支付链
- 支付币种
- 收款地址
- 是否启用

## 5. 应用付费

应用支持：

- 免费
- 付费

付费应用需要购买后才能下载。

## 6. 登录方式

必须支持：

- Supabase 第三方 OAuth
- 钱包浏览器插件登录

可扩展：

- 邮箱验证码
- Magic Link

## 7. 支付方式

首期支持：

- EVM 链上付款
- native token
- ERC20 token

后续可扩展：

- Stripe
- 支付宝
- 微信支付
- 手动转账审核
