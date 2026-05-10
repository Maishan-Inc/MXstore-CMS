insert into public.system_settings (key, value, group_name)
values (
  'footer_config',
  '{
    "enabled": true,
    "brandName": "MXStore",
    "copyright": "Copyright © 2026 Maishan Inc. All rights reserved",
    "description": "MXStore 是 Maishan Inc. 提供的数字应用商店与签名下载系统，支持应用分发、钱包登录、链上支付和 OpenList 临时签名下载。",
    "links": [
      { "label": "用户协议", "href": "/terms", "enabled": true },
      { "label": "隐私政策", "href": "/privacy", "enabled": true },
      { "label": "应用商店", "href": "/apps", "enabled": true },
      { "label": "登录", "href": "/login", "enabled": true }
    ],
    "socials": [
      { "id": "facebook", "label": "Facebook", "href": "", "enabled": false },
      { "id": "x", "label": "X", "href": "", "enabled": false },
      { "id": "instagram", "label": "Instagram", "href": "", "enabled": false },
      { "id": "youtube", "label": "YouTube", "href": "", "enabled": false },
      { "id": "linkedin", "label": "LinkedIn", "href": "", "enabled": false },
      { "id": "github", "label": "GitHub", "href": "", "enabled": false },
      { "id": "telegram", "label": "Telegram", "href": "", "enabled": false },
      { "id": "discord", "label": "Discord", "href": "", "enabled": false }
    ]
  }',
  'site'
)
on conflict (key) do nothing;
