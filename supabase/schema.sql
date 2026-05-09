create extension if not exists pgcrypto;

do $$
begin
  create type public.user_status as enum ('active', 'suspended', 'banned');
exception
  when duplicate_object then null;
end $$;

alter type public.user_status add value if not exists 'suspended';
alter type public.user_status add value if not exists 'banned';

do $$
begin
  create type public.post_status as enum ('active', 'under_review', 'removed');
exception
  when duplicate_object then null;
end $$;

alter type public.post_status add value if not exists 'under_review';
alter type public.post_status add value if not exists 'removed';

do $$
begin
  create type public.post_visibility as enum ('public', 'followers');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_status as enum ('open', 'reviewing', 'dismissed', 'resolved');
exception
  when duplicate_object then null;
end $$;

alter type public.report_status add value if not exists 'reviewing';
alter type public.report_status add value if not exists 'dismissed';
alter type public.report_status add value if not exists 'resolved';

do $$
begin
  create type public.delete_request_status as enum ('open', 'completed', 'cancelled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text,
  vibe_color text not null default '#39FF88',
  status public.user_status not null default 'active',
  is_admin boolean not null default false,
  public_score_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists display_name text not null default '';
alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists vibe_color text not null default '#39FF88';
alter table public.profiles add column if not exists status public.user_status not null default 'active';
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists public_score_enabled boolean not null default true;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'handle'
  ) then
    update public.profiles set username = lower(handle) where username is null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'role'
  ) then
    update public.profiles set is_admin = true where role::text = 'admin';
  end if;

  update public.profiles set status = 'suspended' where status::text = 'blocked';
end $$;

update public.profiles
set username = 'user_' || replace(id::text, '-', '')
where username is null or username = '';

alter table public.profiles alter column username set not null;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_username_format') then
    alter table public.profiles add constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,24}$') not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_display_name_length') then
    alter table public.profiles add constraint profiles_display_name_length check (char_length(display_name) between 1 and 80) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_bio_length') then
    alter table public.profiles add constraint profiles_bio_length check (char_length(bio) <= 240) not valid;
  end if;
end $$;
create unique index if not exists profiles_username_key on public.profiles (username);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  caption text not null default '',
  body text not null default '',
  image_url text not null,
  category text not null default 'Daily',
  mood text not null default 'Glowy',
  visibility public.post_visibility not null default 'public',
  rating_enabled boolean not null default true,
  daily_vibe boolean not null default false,
  status public.post_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts add column if not exists caption text not null default '';
alter table public.posts add column if not exists body text not null default '';
alter table public.posts add column if not exists image_url text;
alter table public.posts add column if not exists category text not null default 'Daily';
alter table public.posts add column if not exists mood text not null default 'Glowy';
alter table public.posts add column if not exists visibility public.post_visibility not null default 'public';
alter table public.posts add column if not exists rating_enabled boolean not null default true;
alter table public.posts add column if not exists daily_vibe boolean not null default false;
alter table public.posts add column if not exists status public.post_status not null default 'active';
alter table public.posts add column if not exists created_at timestamptz not null default now();
alter table public.posts add column if not exists updated_at timestamptz not null default now();

update public.posts set caption = body where caption = '' and body <> '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_caption_length') then
    alter table public.posts add constraint posts_caption_length check (char_length(caption) <= 280) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'posts_category_length') then
    alter table public.posts add constraint posts_category_length check (char_length(category) between 1 and 32) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'posts_mood_length') then
    alter table public.posts add constraint posts_mood_length check (char_length(mood) between 1 and 32) not valid;
  end if;
end $$;

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  value int not null check (value between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

do $$
begin
  if to_regclass('public.user_blocks') is not null then
    execute '
      insert into public.blocks (blocker_id, blocked_id, created_at)
      select blocker_id, blocked_id, created_at
      from public.user_blocks
      on conflict do nothing
    ';
  end if;
end $$;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid references public.profiles(id) on delete cascade,
  reported_post_id uuid references public.posts(id) on delete cascade,
  reason text not null,
  details text not null default '',
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  check (reported_user_id is not null or reported_post_id is not null)
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reports' and column_name = 'post_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reports' and column_name = 'reported_post_id'
  ) then
    alter table public.reports rename column post_id to reported_post_id;
  end if;
end $$;

alter table public.reports add column if not exists reporter_id uuid references public.profiles(id) on delete cascade;
alter table public.reports add column if not exists reported_user_id uuid references public.profiles(id) on delete cascade;
alter table public.reports add column if not exists reported_post_id uuid references public.posts(id) on delete cascade;
alter table public.reports add column if not exists reason text not null default 'Other';
alter table public.reports add column if not exists details text not null default '';
alter table public.reports add column if not exists status public.report_status not null default 'open';
alter table public.reports add column if not exists created_at timestamptz not null default now();
alter table public.reports alter column reported_post_id drop not null;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'reports_reason_length') then
    alter table public.reports add constraint reports_reason_length check (char_length(reason) between 1 and 80) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'reports_details_length') then
    alter table public.reports add constraint reports_details_length check (char_length(details) <= 800) not valid;
  end if;
end $$;

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete restrict,
  target_post_id uuid references public.posts(id) on delete set null,
  target_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.delete_account_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  status public.delete_request_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_author_created_idx on public.posts (author_id, created_at desc);
create index if not exists posts_status_created_idx on public.posts (status, visibility, created_at desc);
create index if not exists ratings_post_idx on public.ratings (post_id);
create index if not exists ratings_user_idx on public.ratings (user_id);
create index if not exists reports_status_created_idx on public.reports (status, created_at desc);
create index if not exists follows_following_idx on public.follows (following_id);
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

drop trigger if exists ratings_set_updated_at on public.ratings;
create trigger ratings_set_updated_at
before update on public.ratings
for each row execute function public.set_updated_at();

drop trigger if exists delete_account_requests_set_updated_at on public.delete_account_requests;
create trigger delete_account_requests_set_updated_at
before update on public.delete_account_requests
for each row execute function public.set_updated_at();

create or replace function public.is_admin(check_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user
      and is_admin = true
      and status = 'active'
  );
$$;

create or replace function public.is_restricted(check_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user
      and status in ('suspended', 'banned')
  );
$$;

create or replace function public.has_block_between(first_user uuid, second_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blocks
    where (blocker_id = first_user and blocked_id = second_user)
       or (blocker_id = second_user and blocked_id = first_user)
  );
$$;

create or replace function public.can_view_post(target_post uuid, viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.posts p
    join public.profiles author on author.id = p.author_id
    where p.id = target_post
      and (
        p.author_id = viewer
        or public.is_admin(viewer)
        or (
          viewer is not null
          and p.status = 'active'
          and author.status = 'active'
          and not public.is_restricted(viewer)
          and not public.has_block_between(viewer, p.author_id)
          and (
            p.visibility = 'public'
            or exists (
              select 1
              from public.follows f
              where f.follower_id = viewer
                and f.following_id = p.author_id
            )
          )
        )
      )
  );
$$;

create or replace function public.can_rate_post(target_post uuid, rating_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.posts p
    join public.profiles author on author.id = p.author_id
    where p.id = target_post
      and rating_user is not null
      and p.author_id <> rating_user
      and p.status = 'active'
      and p.rating_enabled = true
      and author.status = 'active'
      and not public.is_restricted(rating_user)
      and not public.has_block_between(rating_user, p.author_id)
  );
$$;

create or replace function public.prevent_profile_privilege_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    new.is_admin = old.is_admin;
    new.status = old.status;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_privilege_change on public.profiles;
create trigger profiles_prevent_privilege_change
before update on public.profiles
for each row execute function public.prevent_profile_privilege_change();

create or replace function public.prevent_post_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    new.status = old.status;
  end if;

  return new;
end;
$$;

drop trigger if exists posts_prevent_status_change on public.posts;
create trigger posts_prevent_status_change
before update on public.posts
for each row execute function public.prevent_post_status_change();

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.ratings enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.delete_account_requests enable row level security;

drop policy if exists profiles_select_visible on public.profiles;
create policy profiles_select_visible
on public.profiles for select
using (
  auth.uid() = id
  or public.is_admin(auth.uid())
  or (
    auth.uid() is not null
    and status = 'active'
    and not public.is_restricted(auth.uid())
    and not public.has_block_between(auth.uid(), id)
  )
);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles for insert
with check (
  auth.uid() = id
  and is_admin = false
  and status = 'active'
);

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
on public.profiles for update
using (auth.uid() = id or public.is_admin(auth.uid()))
with check (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists posts_select_visible on public.posts;
create policy posts_select_visible
on public.posts for select
using (public.can_view_post(id, auth.uid()));

drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own
on public.posts for insert
with check (
  auth.uid() = author_id
  and status = 'active'
  and image_url is not null
  and image_url <> ''
  and not public.is_restricted(auth.uid())
);

drop policy if exists posts_update_own_or_admin on public.posts;
create policy posts_update_own_or_admin
on public.posts for update
using (
  public.is_admin(auth.uid())
  or (auth.uid() = author_id and not public.is_restricted(auth.uid()))
)
with check (
  public.is_admin(auth.uid())
  or (auth.uid() = author_id and not public.is_restricted(auth.uid()))
);

drop policy if exists posts_delete_own_or_admin on public.posts;
create policy posts_delete_own_or_admin
on public.posts for delete
using (auth.uid() = author_id or public.is_admin(auth.uid()));

drop policy if exists ratings_select_for_visible_posts on public.ratings;
create policy ratings_select_for_visible_posts
on public.ratings for select
using (public.can_view_post(post_id, auth.uid()));

drop policy if exists ratings_insert_not_own_post on public.ratings;
create policy ratings_insert_not_own_post
on public.ratings for insert
with check (
  auth.uid() = user_id
  and public.can_rate_post(post_id, auth.uid())
);

drop policy if exists ratings_update_own on public.ratings;
create policy ratings_update_own
on public.ratings for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and public.can_rate_post(post_id, auth.uid())
);

drop policy if exists ratings_delete_own on public.ratings;
create policy ratings_delete_own
on public.ratings for delete
using (auth.uid() = user_id);

drop policy if exists follows_select_own on public.follows;
create policy follows_select_own
on public.follows for select
using (auth.uid() = follower_id or auth.uid() = following_id);

drop policy if exists follows_insert_own on public.follows;
create policy follows_insert_own
on public.follows for insert
with check (
  auth.uid() = follower_id
  and follower_id <> following_id
  and not public.is_restricted(auth.uid())
  and not public.has_block_between(follower_id, following_id)
);

drop policy if exists follows_delete_own on public.follows;
create policy follows_delete_own
on public.follows for delete
using (auth.uid() = follower_id);

drop policy if exists blocks_select_own on public.blocks;
create policy blocks_select_own
on public.blocks for select
using (auth.uid() = blocker_id);

drop policy if exists blocks_insert_own on public.blocks;
create policy blocks_insert_own
on public.blocks for insert
with check (
  auth.uid() = blocker_id
  and blocker_id <> blocked_id
  and not public.is_restricted(auth.uid())
);

drop policy if exists blocks_delete_own on public.blocks;
create policy blocks_delete_own
on public.blocks for delete
using (auth.uid() = blocker_id);

drop policy if exists reports_insert_authenticated on public.reports;
create policy reports_insert_authenticated
on public.reports for insert
with check (
  auth.uid() = reporter_id
  and not public.is_restricted(auth.uid())
  and (reported_user_id is not null or reported_post_id is not null)
);

drop policy if exists reports_select_own_or_admin on public.reports;
create policy reports_select_own_or_admin
on public.reports for select
using (auth.uid() = reporter_id or public.is_admin(auth.uid()));

drop policy if exists reports_admin_update on public.reports;
create policy reports_admin_update
on public.reports for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists moderation_actions_admin_select on public.moderation_actions;
create policy moderation_actions_admin_select
on public.moderation_actions for select
using (public.is_admin(auth.uid()));

drop policy if exists moderation_actions_admin_insert on public.moderation_actions;
create policy moderation_actions_admin_insert
on public.moderation_actions for insert
with check (
  public.is_admin(auth.uid())
  and admin_id = auth.uid()
);

drop policy if exists delete_account_requests_own_insert on public.delete_account_requests;
create policy delete_account_requests_own_insert
on public.delete_account_requests for insert
with check (auth.uid() = user_id);

drop policy if exists delete_account_requests_own_or_admin_select on public.delete_account_requests;
create policy delete_account_requests_own_or_admin_select
on public.delete_account_requests for select
using (auth.uid() = user_id or public.is_admin(auth.uid()));

drop policy if exists delete_account_requests_admin_update on public.delete_account_requests;
create policy delete_account_requests_admin_update
on public.delete_account_requests for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists delete_account_requests_own_update on public.delete_account_requests;
create policy delete_account_requests_own_update
on public.delete_account_requests for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id and status = 'open');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('post-images', 'post-images', true, 5242880, array['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists avatars_owner_insert on storage.objects;
create policy avatars_owner_insert
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists avatars_owner_update on storage.objects;
create policy avatars_owner_update
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists avatars_owner_delete on storage.objects;
create policy avatars_owner_delete
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists post_images_public_read on storage.objects;
create policy post_images_public_read
on storage.objects for select
using (bucket_id = 'post-images');

drop policy if exists post_images_owner_insert on storage.objects;
create policy post_images_owner_insert
on storage.objects for insert
with check (
  bucket_id = 'post-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists post_images_owner_update on storage.objects;
create policy post_images_owner_update
on storage.objects for update
using (
  bucket_id = 'post-images'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'post-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists post_images_owner_delete on storage.objects;
create policy post_images_owner_delete
on storage.objects for delete
using (
  bucket_id = 'post-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, update, delete on public.ratings to authenticated;
grant select, insert, delete on public.follows to authenticated;
grant select, insert, delete on public.blocks to authenticated;
grant select, insert, update on public.reports to authenticated;
grant select, insert on public.moderation_actions to authenticated;
grant select, insert, update on public.delete_account_requests to authenticated;
