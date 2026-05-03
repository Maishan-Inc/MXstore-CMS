create extension if not exists pgcrypto;

create table if not exists public.store_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text,
  wallet_address text unique,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.token_domains (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  openlist_base_url text not null,
  encrypted_admin_token text not null,
  sign_ttl_seconds integer not null default 300 check (sign_ttl_seconds >= 0),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.apps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  version text,
  platform text,
  logo_url text,
  published boolean not null default false,
  is_paid boolean not null default false,
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'USD',
  created_by uuid references public.store_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_links (
  id uuid primary key default gen_random_uuid(),
  app_id uuid not null references public.apps(id) on delete cascade,
  token_domain_id uuid references public.token_domains(id) on delete set null,
  name text not null,
  input_url text not null,
  link_kind text not null default 'external' check (link_kind in ('openlist', 'external')),
  file_size_bytes bigint,
  charge_traffic boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.app_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.store_users(id) on delete cascade,
  app_id uuid not null references public.apps(id) on delete cascade,
  source text not null default 'manual' check (source in ('manual', 'payment', 'promo')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, app_id)
);

create table if not exists public.download_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.store_users(id) on delete cascade,
  app_id uuid not null references public.apps(id) on delete cascade,
  app_link_id uuid not null references public.app_links(id) on delete cascade,
  status text not null default 'issued' check (status in ('issued', 'used', 'expired', 'revoked')),
  link_kind text not null check (link_kind in ('openlist', 'external')),
  openlist_path text,
  bytes_charged bigint not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.traffic_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  bytes_amount bigint not null check (bytes_amount > 0),
  chain_id integer not null,
  asset_type text not null default 'native' check (asset_type in ('native', 'erc20')),
  token_contract text,
  token_symbol text,
  token_decimals integer,
  amount_raw numeric(78,0) not null,
  pay_to_address text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.store_users(id) on delete cascade,
  package_id uuid references public.traffic_packages(id) on delete set null,
  provider text not null default 'evm',
  chain_id integer not null,
  tx_hash text not null unique,
  amount_raw numeric(78,0) not null,
  payer_address text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  confirmed_block text,
  reject_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_traffic_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.store_users(id) on delete cascade,
  delta_bytes bigint not null,
  reason text not null check (reason in ('purchase_traffic', 'download', 'admin_adjust')),
  payment_id uuid references public.payments(id) on delete set null,
  download_session_id uuid references public.download_sessions(id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace view public.user_traffic_balances as
select
  user_id,
  coalesce(sum(delta_bytes), 0)::bigint as balance_bytes
from public.user_traffic_ledger
group by user_id;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.store_users
    where auth_user_id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.store_users (auth_user_id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', new.email))
  on conflict (auth_user_id)
  do update set email = excluded.email, display_name = excluded.display_name, updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

alter table public.store_users enable row level security;
alter table public.token_domains enable row level security;
alter table public.apps enable row level security;
alter table public.app_links enable row level security;
alter table public.app_entitlements enable row level security;
alter table public.download_sessions enable row level security;
alter table public.traffic_packages enable row level security;
alter table public.payments enable row level security;
alter table public.user_traffic_ledger enable row level security;

create policy "users can read own profile"
on public.store_users for select
to authenticated
using (auth_user_id = auth.uid() or public.is_admin());

create policy "public can read published apps"
on public.apps for select
to anon, authenticated
using (published = true or public.is_admin());

create policy "public can read published app links"
on public.app_links for select
to anon, authenticated
using (exists (select 1 from public.apps a where a.id = app_id and a.published = true) or public.is_admin());

create policy "public can read enabled packages"
on public.traffic_packages for select
to anon, authenticated
using (enabled = true or public.is_admin());

create policy "admins manage token domains"
on public.token_domains for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage apps"
on public.apps for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins manage app links"
on public.app_links for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "users read own entitlements"
on public.app_entitlements for select
to authenticated
using (exists (select 1 from public.store_users u where u.auth_user_id = auth.uid() and u.id = user_id) or public.is_admin());

create policy "users read own download sessions"
on public.download_sessions for select
to authenticated
using (exists (select 1 from public.store_users u where u.auth_user_id = auth.uid() and u.id = user_id) or public.is_admin());

create policy "users read own payments"
on public.payments for select
to authenticated
using (exists (select 1 from public.store_users u where u.auth_user_id = auth.uid() and u.id = user_id) or public.is_admin());

create policy "users read own traffic ledger"
on public.user_traffic_ledger for select
to authenticated
using (exists (select 1 from public.store_users u where u.auth_user_id = auth.uid() and u.id = user_id) or public.is_admin());

-- Seed example traffic packages. Replace pay_to_address before production.
insert into public.traffic_packages (name, bytes_amount, chain_id, asset_type, token_symbol, amount_raw, pay_to_address)
values
  ('10GB 流量包', 10737418240, 8453, 'native', 'ETH', 1000000000000000, '0x0000000000000000000000000000000000000000'),
  ('100GB 流量包', 107374182400, 8453, 'native', 'ETH', 5000000000000000, '0x0000000000000000000000000000000000000000')
on conflict do nothing;
