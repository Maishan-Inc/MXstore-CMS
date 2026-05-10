alter table public.store_users add column if not exists email_verified_at timestamptz;
alter table public.store_users add column if not exists identity_public_email_verified_at timestamptz;
alter table public.store_users add column if not exists identity_private_email_verified_at timestamptz;

create table if not exists public.email_verification_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.store_users(id) on delete cascade,
  purpose text not null check (purpose in ('account_email', 'identity_public_email', 'identity_private_email')),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_verification_codes_user_purpose_idx
on public.email_verification_codes(user_id, purpose, created_at desc);

create table if not exists public.user_kyc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.store_users(id) on delete cascade,
  document_type text not null check (document_type in ('business_license', 'identity_front', 'identity_back', 'other')),
  original_filename text not null,
  storage_key text not null,
  storage_url text,
  mime_type text,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  reviewed_by uuid references public.store_users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_kyc_documents_user_idx
on public.user_kyc_documents(user_id, created_at desc);

create table if not exists public.user_kyc_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.store_users(id) on delete cascade,
  provider text not null default 'didit' check (provider in ('didit')),
  provider_session_id text,
  provider_status text,
  verification_url text,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_kyc_sessions_user_idx
on public.user_kyc_sessions(user_id, created_at desc);

alter table public.email_verification_codes enable row level security;
alter table public.user_kyc_documents enable row level security;
alter table public.user_kyc_sessions enable row level security;

drop policy if exists "users read own email verification codes" on public.email_verification_codes;
create policy "users read own email verification codes"
on public.email_verification_codes for select
to authenticated
using (exists (select 1 from public.store_users u where u.auth_user_id = auth.uid() and u.id = user_id) or public.is_admin());

drop policy if exists "users read own kyc documents" on public.user_kyc_documents;
create policy "users read own kyc documents"
on public.user_kyc_documents for select
to authenticated
using (exists (select 1 from public.store_users u where u.auth_user_id = auth.uid() and u.id = user_id) or public.is_admin());

drop policy if exists "users read own kyc sessions" on public.user_kyc_sessions;
create policy "users read own kyc sessions"
on public.user_kyc_sessions for select
to authenticated
using (exists (select 1 from public.store_users u where u.auth_user_id = auth.uid() and u.id = user_id) or public.is_admin());
