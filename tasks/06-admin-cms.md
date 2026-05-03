# 06 管理员后台开发任务

## 1. 管理后台首页

路径：

```txt
/admin
```

内容：

- 应用总数
- 今日下载
- 付费订单
- 活跃用户
- 最近订单
- 下载配置概览

## 2. 应用管理

路径：

```txt
/admin/apps
/admin/apps/new
/admin/apps/[id]/edit
```

功能：

- 创建应用
- 编辑应用
- 发布/下架应用
- 设置免费/付费
- 设置价格
- 管理图标与封面
- 管理版本信息

## 3. 下载链接管理

功能：

- 一个应用多个下载链接
- 链接名称可编辑
- 类型可选 OpenList / 外部链接
- 自动解析 OpenList 域名与路径
- 显示是否匹配到 Token
- 支持排序
- 支持启用/停用

## 4. 域名与 Token 管理

路径：

```txt
/admin/settings/domains
```

字段：

- 域名
- OpenList Base URL
- 管理员 Token
- 签名有效期
- 是否启用

要求：

- Token 输入后加密保存
- 列表页不显示明文 Token
- 支持测试签名

## 5. 流量套餐

路径：

```txt
/admin/settings/packages
```

字段：

- 套餐名称
- 流量大小
- 价格
- 链 ID
- 币种
- 收款地址
- 是否启用

## 6. 订单支付

路径：

```txt
/admin/orders
```

展示：

- 订单号
- 用户
- 金额
- 类型
- 支付状态
- tx hash
- 创建时间

## 7. 用户管理

路径：

```txt
/admin/users
```

展示：

- 用户 ID
- 邮箱
- 钱包地址
- 角色
- 流量余额
- 已购应用数
