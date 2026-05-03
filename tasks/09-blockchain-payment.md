# 09 区块链支付

## 1. 支付类型

支持：

- 购买流量套餐
- 购买付费应用

## 2. 支付资产

支持：

- native token
- ERC20 token

## 3. 支付流程

1. 用户创建订单。
2. 前端展示收款地址、金额、链。
3. 用户用钱包付款。
4. 前端提交 tx hash。
5. 后端通过 RPC 验证。
6. 验证通过后发放：
   - 流量余额
   - 应用权益

## 4. 验证规则

必须校验：

- chainId
- tx hash 存在
- tx 成功
- from 是用户钱包或可接受地址
- to 是配置的收款地址
- value / token amount 足够
- token contract 正确
- 未重复入账

## 5. 订单状态

建议状态：

- `pending`
- `paid`
- `failed`
- `expired`
- `refunded`

## 6. 幂等

`payments.tx_hash + chain_id` 必须唯一。

重复提交同一 tx hash 不得重复发放权益。
