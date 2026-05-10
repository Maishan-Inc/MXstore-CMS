import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export type FooterLink = {
  label: string
  href: string
  enabled: boolean
}

export type FooterLinkGroup = {
  title: string
  links: FooterLink[]
}

export type FooterSocialId = 'facebook' | 'x' | 'instagram' | 'youtube' | 'linkedin' | 'github' | 'telegram' | 'discord'

export type FooterSocialLink = {
  id: FooterSocialId
  label: string
  href: string
  enabled: boolean
}

export type FooterSettings = {
  enabled: boolean
  brandName: string
  copyright: string
  description: string
  links: FooterLink[]
  linkGroups: FooterLinkGroup[]
  socials: FooterSocialLink[]
}

export const defaultFooterSettings: FooterSettings = {
  enabled: true,
  brandName: 'MXStore',
  copyright: 'Copyright © 2026 Maishan Inc. All rights reserved',
  description: 'MXStore 是 Maishan Inc. 提供的数字应用商店与签名下载系统，支持应用分发、钱包登录、链上支付和快速下载。',
  links: [
    { label: '推荐', href: '/', enabled: true },
    { label: '应用商店', href: '/apps', enabled: true },
    { label: '用户后台', href: '/dashboard', enabled: true },
    { label: '用户协议', href: '/terms', enabled: true },
    { label: '隐私政策', href: '/privacy', enabled: true }
  ],
  linkGroups: [
    {
      title: '分类',
      links: [
        { label: '推荐', href: '/', enabled: true },
        { label: '全部应用', href: '/apps', enabled: true },
        { label: '开发工具', href: '/category/developer-tools', enabled: true },
        { label: 'AI 应用', href: '/category/ai-apps', enabled: true }
      ]
    },
    {
      title: '用户后台',
      links: [
        { label: '用户后台', href: '/dashboard', enabled: true },
        { label: '流量套餐', href: '/dashboard/billing', enabled: true },
        { label: '我的订单', href: '/dashboard/orders', enabled: true },
        { label: '账户设置', href: '/dashboard/settings', enabled: true }
      ]
    },
    {
      title: '协议',
      links: [
        { label: '用户协议', href: '/terms', enabled: true },
        { label: '隐私政策', href: '/privacy', enabled: true }
      ]
    },
    {
      title: '文档',
      links: [
        { label: '下载说明', href: '/terms#section-4', enabled: true },
        { label: '钱包登录', href: '/privacy#section-3', enabled: true },
        { label: '链上支付', href: '/terms#section-5', enabled: true },
        { label: '快速下载', href: '/terms#section-4', enabled: true }
      ]
    }
  ],
  socials: [
    { id: 'facebook', label: 'Facebook', href: '', enabled: false },
    { id: 'x', label: 'X', href: '', enabled: false },
    { id: 'instagram', label: 'Instagram', href: '', enabled: false },
    { id: 'youtube', label: 'YouTube', href: '', enabled: false },
    { id: 'linkedin', label: 'LinkedIn', href: '', enabled: false },
    { id: 'github', label: 'GitHub', href: '', enabled: false },
    { id: 'telegram', label: 'Telegram', href: '', enabled: false },
    { id: 'discord', label: 'Discord', href: '', enabled: false }
  ]
}

function normalizeFooterSettings(value: unknown): FooterSettings {
  const input = typeof value === 'object' && value !== null ? value as Partial<FooterSettings> : {}
  const linkMap = new Map((input.links ?? []).map((link) => [link.label, link]))
  const groupMap = new Map((input.linkGroups ?? []).map((group) => [group.title, group]))
  const socialMap = new Map((input.socials ?? []).map((social) => [social.id, social]))

  return {
    enabled: typeof input.enabled === 'boolean' ? input.enabled : defaultFooterSettings.enabled,
    brandName: typeof input.brandName === 'string' && input.brandName.trim() ? input.brandName.trim() : defaultFooterSettings.brandName,
    copyright: typeof input.copyright === 'string' && input.copyright.trim() ? input.copyright.trim() : defaultFooterSettings.copyright,
    description: typeof input.description === 'string' && input.description.includes('OpenList 临时签名下载')
      ? defaultFooterSettings.description
      : typeof input.description === 'string'
        ? input.description
        : defaultFooterSettings.description,
    links: defaultFooterSettings.links.map((fallback) => {
      const link = linkMap.get(fallback.label)
      return {
        label: typeof link?.label === 'string' && link.label.trim() ? link.label.trim() : fallback.label,
        href: typeof link?.href === 'string' && link.href.trim() ? link.href.trim() : fallback.href,
        enabled: typeof link?.enabled === 'boolean' ? link.enabled : fallback.enabled
      }
    }),
    linkGroups: defaultFooterSettings.linkGroups.map((fallbackGroup) => {
      const group = groupMap.get(fallbackGroup.title)
      const groupLinkMap = new Map((group?.links ?? []).map((link) => [link.label, link]))
      return {
        title: typeof group?.title === 'string' && group.title.trim() ? group.title.trim() : fallbackGroup.title,
        links: fallbackGroup.links.map((fallback) => {
          const link = groupLinkMap.get(fallback.label)
          return {
            label: typeof link?.label === 'string' && link.label.trim() ? link.label.trim() : fallback.label,
            href: typeof link?.href === 'string' && link.href.trim() ? link.href.trim() : fallback.href,
            enabled: typeof link?.enabled === 'boolean' ? link.enabled : fallback.enabled
          }
        })
      }
    }),
    socials: defaultFooterSettings.socials.map((fallback) => {
      const social = socialMap.get(fallback.id)
      return {
        id: fallback.id,
        label: fallback.label,
        href: typeof social?.href === 'string' ? social.href.trim() : fallback.href,
        enabled: typeof social?.enabled === 'boolean' ? social.enabled : fallback.enabled
      }
    })
  }
}

export async function getFooterSettings(): Promise<FooterSettings> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return defaultFooterSettings
  }

  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'footer_config')
      .maybeSingle()

    if (error || !data?.value) return defaultFooterSettings
    return normalizeFooterSettings(JSON.parse(data.value))
  } catch {
    return defaultFooterSettings
  }
}
