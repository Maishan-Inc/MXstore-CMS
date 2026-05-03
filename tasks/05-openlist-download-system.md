# 05 OpenList 签名下载系统

## 1. 目标

管理员输入 OpenList `/p/...` 链接，用户下载时由后端生成临时 `/d/...?...sign=` 链接。

## 2. 域名匹配

输入：

```txt
http://oss-us-hk.smvapi.store/p/one/文件.mkv
```

解析：

```txt
domain = oss-us-hk.smvapi.store
```

查询：

```txt
token_domains.domain = oss-us-hk.smvapi.store
```

获得：

- `openlist_base_url`
- `admin_token_ciphertext`
- `sign_ttl_seconds`

## 3. 路径解析

输入路径：

```txt
/p/one/%E7%BD%97%E5%B0%8F%E9%BB%91.mkv
```

OpenList 内部路径：

```txt
/one/罗小黑.mkv
```

签名时使用内部路径，不包含 `/p`，不包含 `/d`。

## 4. 签名算法

```txt
to_sign = openlistPath + ":" + expireTimestamp
signature = safeBase64(HMAC-SHA256(to_sign, adminToken))
sign = signature + ":" + expireTimestamp
```

## 5. 下载跳转

最终 URL：

```txt
{openlist_base_url}/d{encoded_openlist_path}?sign={sign}
```

## 6. 计费点

下载次数和流量扣减以“生成下载会话”为准。

不要按 HTTP Range 请求次数扣费。

## 7. 失败情况

必须处理：

- 域名未配置 Token
- Token 已停用
- OpenList URL 不合法
- 用户无权限
- 流量不足
- 应用未发布
- 下载链接已停用
