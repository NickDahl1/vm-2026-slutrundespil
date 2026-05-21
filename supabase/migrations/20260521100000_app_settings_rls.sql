-- Ensure app_settings has RLS enabled and correct policies.
-- Idempotent: safe to run multiple times.

alter table public.app_settings enable row level security;

-- Drop existing policies to avoid duplicates
drop policy if exists "Authenticated users can read app_settings" on public.app_settings;
drop policy if exists "Admin can update app_settings"             on public.app_settings;

-- All authenticated users can read settings (needed for lock checks on every page)
create policy "Authenticated users can read app_settings"
  on public.app_settings
  for select
  using (auth.role() = 'authenticated');

-- Only admins can update settings
create policy "Admin can update app_settings"
  on public.app_settings
  for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
