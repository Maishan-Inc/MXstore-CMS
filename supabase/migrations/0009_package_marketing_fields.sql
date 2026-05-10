alter table public.traffic_packages add column if not exists description text not null default '';
alter table public.traffic_packages add column if not exists badge text not null default '';
alter table public.traffic_packages add column if not exists display_price text not null default '';
alter table public.traffic_packages add column if not exists traffic_label text not null default '';
alter table public.traffic_packages add column if not exists cta_label text not null default '钱包付款并自动校验';
alter table public.traffic_packages add column if not exists features text[] not null default '{}';
alter table public.traffic_packages add column if not exists highlighted boolean not null default false;
alter table public.traffic_packages add column if not exists sort_order integer not null default 0;
alter table public.traffic_packages add column if not exists updated_at timestamptz not null default now();

update public.traffic_packages
set
  description = case when description = '' then '适合日常应用下载和基础分发使用。' else description end,
  traffic_label = case when traffic_label = '' then name else traffic_label end,
  cta_label = case when cta_label = '' then '钱包付款并自动校验' else cta_label end,
  features = case
    when cardinality(features) = 0 then array['链上付款自动校验', '到账后自动增加下载流量', '支持手动粘贴 txHash 校验']
    else features
  end,
  updated_at = now();
