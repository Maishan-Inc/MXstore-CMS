alter table public.apps add column if not exists show_on_recommended boolean not null default false;
alter table public.apps add column if not exists recommendation_heat integer not null default 0;

do $$
begin
  alter table public.apps add constraint apps_recommendation_heat_check
    check (recommendation_heat >= 0 and (show_on_recommended = false or recommendation_heat > 0));
exception when duplicate_object then null;
end $$;

alter table public.home_banners add column if not exists placement text not null default 'recommended';
alter table public.home_banners add column if not exists category_id uuid references public.app_categories(id) on delete set null;
alter table public.home_banners add column if not exists app_id uuid references public.apps(id) on delete set null;
alter table public.home_banners add column if not exists image_openlist_domain text;

do $$
begin
  alter table public.home_banners add constraint home_banners_placement_check
    check (placement in ('recommended', 'category'));
exception when duplicate_object then null;
end $$;

create index if not exists apps_recommended_sort_idx
on public.apps (show_on_recommended, recommendation_heat desc, created_at desc);

create index if not exists home_banners_context_sort_idx
on public.home_banners (placement, category_id, sort_order, created_at);
