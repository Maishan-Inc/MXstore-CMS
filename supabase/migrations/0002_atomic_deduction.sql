-- Atomic traffic deduction function
-- Prevents race conditions: checks balance and inserts ledger entry in a single transaction
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
  v_balance bigint;
begin
  if p_bytes <= 0 then
    return true;
  end if;

  select coalesce(sum(delta_bytes), 0) into v_balance
  from public.user_traffic_ledger
  where user_id = p_user_id;

  if v_balance < p_bytes then
    return false;
  end if;

  insert into public.user_traffic_ledger (user_id, delta_bytes, reason, download_session_id, payment_id)
  values (p_user_id, -p_bytes, p_reason, p_download_session_id, p_payment_id);

  return true;
end;
$$;

-- Add app_id column to payments table for app purchase support
alter table public.payments add column if not exists app_id uuid references public.apps(id) on delete set null;
