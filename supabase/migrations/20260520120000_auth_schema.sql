create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 40),
  is_admin boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.app_settings (
  id text primary key default 'global' check (id = 'global'),
  group_stage_lock_at timestamp with time zone,
  knockout_stage_lock_at timestamp with time zone,
  game_locked boolean not null default false,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.admin_messages (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 120),
  body text not null default '',
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.prizes (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 120),
  description text not null default '',
  placement integer check (placement is null or placement > 0),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

insert into public.app_settings (id)
values ('global')
on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at
before update on public.app_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_admin_messages_updated_at on public.admin_messages;
create trigger set_admin_messages_updated_at
before update on public.admin_messages
for each row execute function public.set_updated_at();

drop trigger if exists set_prizes_updated_at on public.prizes;
create trigger set_prizes_updated_at
before update on public.prizes
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_display_name text;
begin
  requested_display_name := left(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 40);

  if requested_display_name is null or char_length(requested_display_name) < 2 then
    requested_display_name := 'Spiller';
  end if;

  insert into public.profiles (id, display_name)
  values (
    new.id,
    requested_display_name
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and is_admin = true
  );
$$;

alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.admin_messages enable row level security;
alter table public.prizes enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
on public.profiles for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can insert profiles" on public.profiles;
create policy "Admins can insert profiles"
on public.profiles for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
on public.profiles for delete
to authenticated
using (public.is_admin());

drop policy if exists "Authenticated users can read app settings" on public.app_settings;
create policy "Authenticated users can read app settings"
on public.app_settings for select
to authenticated
using (true);

drop policy if exists "Admins can manage app settings" on public.app_settings;
create policy "Admins can manage app settings"
on public.app_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Authenticated users can read admin messages" on public.admin_messages;
create policy "Authenticated users can read admin messages"
on public.admin_messages for select
to authenticated
using (true);

drop policy if exists "Admins can manage admin messages" on public.admin_messages;
create policy "Admins can manage admin messages"
on public.admin_messages for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Authenticated users can read prizes" on public.prizes;
create policy "Authenticated users can read prizes"
on public.prizes for select
to authenticated
using (true);

drop policy if exists "Admins can manage prizes" on public.prizes;
create policy "Admins can manage prizes"
on public.prizes for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
