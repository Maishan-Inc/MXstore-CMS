alter table public.store_users add column if not exists account_type text not null default 'unselected';
alter table public.store_users add column if not exists developer_name text;
alter table public.store_users add column if not exists developer_avatar_url text;
alter table public.store_users add column if not exists organization_name text;
alter table public.store_users add column if not exists enterprise_certification_status text not null default 'not_required';
alter table public.store_users add column if not exists enterprise_certification_note text;
alter table public.store_users add column if not exists team_plan_status text not null default 'none';
alter table public.store_users add column if not exists download_quota_bytes bigint not null default 1073741824 check (download_quota_bytes >= 0);
alter table public.store_users add column if not exists distribution_quota_bytes bigint not null default 1073741824 check (distribution_quota_bytes >= 0);
alter table public.store_users add column if not exists distribution_charge_threshold_bytes bigint not null default 1073741824 check (distribution_charge_threshold_bytes >= 0);

do $$
begin
  alter table public.store_users add constraint store_users_account_type_check
    check (account_type in ('unselected', 'personal', 'independent_developer', 'team_studio', 'enterprise'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.store_users add constraint store_users_enterprise_certification_status_check
    check (enterprise_certification_status in ('not_required', 'pending', 'verified', 'rejected', 'needs_more_info'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.store_users add constraint store_users_team_plan_status_check
    check (team_plan_status in ('none', 'pending', 'active', 'expired'));
exception when duplicate_object then null;
end $$;

alter table public.apps add column if not exists developer_name text;
alter table public.apps add column if not exists developer_avatar_url text;
alter table public.download_sessions add column if not exists distribution_bytes_charged bigint not null default 0;

update public.apps a
set
  developer_name = coalesce(a.developer_name, u.organization_name, u.developer_name, u.display_name, u.email, 'MXStore'),
  developer_avatar_url = coalesce(a.developer_avatar_url, u.developer_avatar_url, u.avatar_url)
from public.store_users u
where a.created_by = u.id
  and (a.developer_name is null or a.developer_avatar_url is null);

create table if not exists public.user_distribution_traffic_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.store_users(id) on delete cascade,
  delta_bytes bigint not null,
  reason text not null check (reason in ('distribution_download', 'admin_adjust')),
  download_session_id uuid references public.download_sessions(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.user_distribution_traffic_ledger enable row level security;

drop policy if exists "users read own distribution traffic ledger" on public.user_distribution_traffic_ledger;
create policy "users read own distribution traffic ledger"
on public.user_distribution_traffic_ledger for select
to authenticated
using (exists (select 1 from public.store_users u where u.auth_user_id = auth.uid() and u.id = user_id) or public.is_admin());

create or replace view public.user_traffic_balances as
select
  u.id as user_id,
  (u.download_quota_bytes + coalesce(sum(l.delta_bytes), 0))::bigint as balance_bytes
from public.store_users u
left join public.user_traffic_ledger l on l.user_id = u.id
group by u.id, u.download_quota_bytes;

create or replace view public.user_distribution_traffic_balances as
select
  u.id as user_id,
  (u.distribution_quota_bytes + coalesce(sum(l.delta_bytes), 0))::bigint as balance_bytes
from public.store_users u
left join public.user_distribution_traffic_ledger l on l.user_id = u.id
group by u.id, u.distribution_quota_bytes;

create or replace function public.deduct_traffic(
  p_user_id uuid,
  p_bytes bigint,
  p_reason text,
  p_download_session_id uuid default null,
  p_payment_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quota bigint;
  v_ledger bigint;
  v_balance bigint;
begin
  if p_bytes <= 0 then
    return true;
  end if;

  select download_quota_bytes into v_quota
  from public.store_users
  where id = p_user_id
  for update;

  if v_quota is null then
    return false;
  end if;

  select coalesce(sum(delta_bytes), 0) into v_ledger
  from public.user_traffic_ledger
  where user_id = p_user_id;

  v_balance := v_quota + v_ledger;

  if v_balance < p_bytes then
    return false;
  end if;

  insert into public.user_traffic_ledger (user_id, delta_bytes, reason, download_session_id, payment_id)
  values (p_user_id, -p_bytes, p_reason, p_download_session_id, p_payment_id);

  return true;
end;
$$;

create or replace function public.deduct_distribution_traffic(
  p_user_id uuid,
  p_bytes bigint,
  p_download_session_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quota bigint;
  v_ledger bigint;
  v_balance bigint;
begin
  if p_bytes <= 0 then
    return true;
  end if;

  select distribution_quota_bytes into v_quota
  from public.store_users
  where id = p_user_id
  for update;

  if v_quota is null then
    return false;
  end if;

  select coalesce(sum(delta_bytes), 0) into v_ledger
  from public.user_distribution_traffic_ledger
  where user_id = p_user_id;

  v_balance := v_quota + v_ledger;

  if v_balance < p_bytes then
    return false;
  end if;

  insert into public.user_distribution_traffic_ledger (user_id, delta_bytes, reason, download_session_id)
  values (p_user_id, -p_bytes, 'distribution_download', p_download_session_id);

  return true;
end;
$$;

create or replace function public.deduct_download_and_distribution_traffic(
  p_user_id uuid,
  p_download_bytes bigint,
  p_distribution_user_id uuid default null,
  p_distribution_bytes bigint default 0,
  p_download_session_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_download_quota bigint;
  v_download_ledger bigint;
  v_distribution_quota bigint;
  v_distribution_ledger bigint;
begin
  if p_download_bytes < 0 or p_distribution_bytes < 0 then
    return false;
  end if;

  if p_download_bytes = 0 and (p_distribution_user_id is null or p_distribution_bytes = 0) then
    return true;
  end if;

  perform 1
  from public.store_users
  where id in (p_user_id, p_distribution_user_id)
  order by id
  for update;

  if p_download_bytes > 0 then
    select download_quota_bytes into v_download_quota
    from public.store_users
    where id = p_user_id;

    select coalesce(sum(delta_bytes), 0) into v_download_ledger
    from public.user_traffic_ledger
    where user_id = p_user_id;

    if v_download_quota is null or v_download_quota + v_download_ledger < p_download_bytes then
      return false;
    end if;
  end if;

  if p_distribution_user_id is not null and p_distribution_bytes > 0 then
    select distribution_quota_bytes into v_distribution_quota
    from public.store_users
    where id = p_distribution_user_id;

    select coalesce(sum(delta_bytes), 0) into v_distribution_ledger
    from public.user_distribution_traffic_ledger
    where user_id = p_distribution_user_id;

    if v_distribution_quota is null or v_distribution_quota + v_distribution_ledger < p_distribution_bytes then
      return false;
    end if;
  end if;

  if p_download_bytes > 0 then
    insert into public.user_traffic_ledger (user_id, delta_bytes, reason, download_session_id)
    values (p_user_id, -p_download_bytes, 'download', p_download_session_id);
  end if;

  if p_distribution_user_id is not null and p_distribution_bytes > 0 then
    insert into public.user_distribution_traffic_ledger (user_id, delta_bytes, reason, download_session_id)
    values (p_distribution_user_id, -p_distribution_bytes, 'distribution_download', p_download_session_id);
  end if;

  return true;
end;
$$;
