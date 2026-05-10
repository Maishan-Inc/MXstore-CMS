update public.system_settings
set
  value = jsonb_set(
    case
      when value::jsonb ? 'linkGroups' then value::jsonb
      else jsonb_set(
        value::jsonb,
        '{linkGroups}',
        '[
          {
            "title": "分类",
            "links": [
              { "label": "推荐", "href": "/", "enabled": true },
              { "label": "全部应用", "href": "/apps", "enabled": true },
              { "label": "开发工具", "href": "/category/developer-tools", "enabled": true },
              { "label": "AI 应用", "href": "/category/ai-apps", "enabled": true }
            ]
          },
          {
            "title": "用户后台",
            "links": [
              { "label": "用户后台", "href": "/dashboard", "enabled": true },
              { "label": "流量套餐", "href": "/dashboard/billing", "enabled": true },
              { "label": "我的订单", "href": "/dashboard/orders", "enabled": true },
              { "label": "账户设置", "href": "/dashboard/settings", "enabled": true }
            ]
          },
          {
            "title": "协议",
            "links": [
              { "label": "用户协议", "href": "/terms", "enabled": true },
              { "label": "隐私政策", "href": "/privacy", "enabled": true }
            ]
          },
          {
            "title": "文档",
            "links": [
              { "label": "下载说明", "href": "/terms#section-4", "enabled": true },
              { "label": "钱包登录", "href": "/privacy#section-3", "enabled": true },
              { "label": "链上支付", "href": "/terms#section-5", "enabled": true },
              { "label": "快速下载", "href": "/terms#section-4", "enabled": true }
            ]
          }
        ]'::jsonb,
        true
      )
    end,
    '{description}',
    to_jsonb('MXStore 是 Maishan Inc. 提供的数字应用商店与签名下载系统，支持应用分发、钱包登录、链上支付和快速下载。'::text),
    true
  )::text,
  updated_at = now()
where key = 'footer_config';
