alter table public.store_users add column if not exists identity_public_email text;
alter table public.store_users add column if not exists identity_private_email text;
alter table public.store_users add column if not exists identity_plan_tier text not null default 'free';
alter table public.store_users add column if not exists identity_plan_status text not null default 'none';
alter table public.store_users add column if not exists identity_plan_started_at timestamptz;
alter table public.store_users add column if not exists identity_plan_expires_at timestamptz;
alter table public.store_users add column if not exists kyc_status text not null default 'not_required';
alter table public.store_users add column if not exists kyc_note text;

do $$
begin
  alter table public.store_users add constraint store_users_identity_plan_tier_check
    check (identity_plan_tier in ('free', 'plus', 'pro', 'max'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.store_users add constraint store_users_identity_plan_status_check
    check (identity_plan_status in ('none', 'active', 'pending_kyc', 'expired', 'frozen'));
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table public.store_users add constraint store_users_kyc_status_check
    check (kyc_status in ('not_required', 'pending', 'verified', 'rejected', 'needs_more_info'));
exception when duplicate_object then null;
end $$;
