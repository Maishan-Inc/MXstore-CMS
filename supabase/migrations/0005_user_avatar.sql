alter table public.store_users add column if not exists avatar_url text;
alter table public.store_users add column if not exists avatar_source text not null default 'none'
  check (avatar_source in ('none', 'oauth', 'custom'));

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_avatar text;
begin
  v_avatar := coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture');

  insert into public.store_users (auth_user_id, email, display_name, avatar_url, avatar_source)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    v_avatar,
    case when v_avatar is null or v_avatar = '' then 'none' else 'oauth' end
  )
  on conflict (auth_user_id)
  do update set
    email = excluded.email,
    display_name = excluded.display_name,
    avatar_url = case
      when public.store_users.avatar_source = 'custom' then public.store_users.avatar_url
      when excluded.avatar_url is null or excluded.avatar_url = '' then public.store_users.avatar_url
      else excluded.avatar_url
    end,
    avatar_source = case
      when public.store_users.avatar_source = 'custom' then public.store_users.avatar_source
      when excluded.avatar_url is null or excluded.avatar_url = '' then public.store_users.avatar_source
      else 'oauth'
    end,
    updated_at = now();
  return new;
end;
$$;
