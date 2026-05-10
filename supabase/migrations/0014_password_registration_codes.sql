create table if not exists public.password_registration_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists password_registration_codes_email_idx
on public.password_registration_codes(email, created_at desc);

alter table public.password_registration_codes enable row level security;
