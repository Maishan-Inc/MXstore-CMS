create table if not exists public.system_settings (
  key text primary key,
  value text not null,
  group_name text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.system_settings enable row level security;

drop policy if exists "public can read system settings" on public.system_settings;
create policy "public can read system settings"
on public.system_settings for select
to anon, authenticated
using (true);

drop policy if exists "admins manage system settings" on public.system_settings;
create policy "admins manage system settings"
on public.system_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
