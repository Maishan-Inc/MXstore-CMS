create table if not exists public.app_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  icon text not null default 'Box',
  sort_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.apps add column if not exists category_id uuid references public.app_categories(id) on delete set null;
alter table public.apps add column if not exists download_permission text not null default 'login'
  check (download_permission in ('public', 'login', 'purchase'));

create table if not exists public.home_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  image_url text,
  cta_label text,
  cta_href text,
  sort_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.login_providers (
  id text primary key,
  provider_type text not null check (provider_type in ('wallet', 'oauth', 'password')),
  label text not null,
  button_text text not null,
  provider text,
  connector_name text,
  icon_url text,
  sort_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_categories enable row level security;
alter table public.home_banners enable row level security;
alter table public.login_providers enable row level security;

drop policy if exists "public can read enabled categories" on public.app_categories;
create policy "public can read enabled categories"
on public.app_categories for select
to anon, authenticated
using (enabled = true or public.is_admin());

drop policy if exists "admins manage categories" on public.app_categories;
create policy "admins manage categories"
on public.app_categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public can read enabled banners" on public.home_banners;
create policy "public can read enabled banners"
on public.home_banners for select
to anon, authenticated
using (enabled = true or public.is_admin());

drop policy if exists "admins manage banners" on public.home_banners;
create policy "admins manage banners"
on public.home_banners for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "public can read enabled login providers" on public.login_providers;
create policy "public can read enabled login providers"
on public.login_providers for select
to anon, authenticated
using (enabled = true or public.is_admin());

drop policy if exists "admins manage login providers" on public.login_providers;
create policy "admins manage login providers"
on public.login_providers for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.app_categories (name, slug, icon, sort_order, enabled)
values
  ('开发工具', 'developer-tools', 'Code2', 10, true),
  ('AI 应用', 'ai-apps', 'Sparkles', 20, true),
  ('钱包', 'wallet', 'Wallet', 30, true),
  ('安全', 'security', 'ShieldCheck', 40, true),
  ('效率', 'productivity', 'Zap', 50, true),
  ('存储', 'storage', 'Database', 60, true)
on conflict (slug) do update set
  name = excluded.name,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  enabled = excluded.enabled,
  updated_at = now();

insert into public.login_providers (id, provider_type, label, button_text, provider, connector_name, sort_order, enabled)
values
  ('tronlink', 'wallet', 'TronLink', '使用 TronLink 登录', null, 'TronLink', 10, true),
  ('binance-wallet', 'wallet', 'Binance Wallet', '使用 Binance Wallet 登录', null, 'Binance Wallet', 20, true),
  ('metamask', 'wallet', 'MetaMask', '使用 MetaMask 登录', null, 'MetaMask', 30, true),
  ('trust-wallet', 'wallet', 'Trust Wallet', '使用 Trust Wallet 登录', null, 'Trust Wallet', 40, true),
  ('okx-wallet', 'wallet', 'OKX Wallet', '使用 OKX Wallet 登录', null, 'OKX Wallet', 50, true),
  ('tokenpocket', 'wallet', 'TokenPocket', '使用 TokenPocket 登录', null, 'TokenPocket', 60, true),
  ('github', 'oauth', 'GitHub', '使用 GitHub 登录', 'github', null, 70, true),
  ('google', 'oauth', 'Google', '使用 Google 登录', 'google', null, 80, true),
  ('maishan', 'password', 'Maishan', '使用 Maishan 登录', null, null, 90, true)
on conflict (id) do update set
  provider_type = excluded.provider_type,
  label = excluded.label,
  button_text = excluded.button_text,
  provider = excluded.provider,
  connector_name = excluded.connector_name,
  sort_order = excluded.sort_order,
  enabled = excluded.enabled,
  updated_at = now();

insert into public.home_banners (title, subtitle, cta_label, cta_href, sort_order, enabled)
values
  ('发现优质应用', '为你的 Web3 体验加速', '探索精选应用', '#featured-apps', 10, true)
on conflict do nothing;
