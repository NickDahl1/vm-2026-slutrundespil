-- Allow admins to delete user-owned records during participant cleanup.
-- Auth users are intentionally not deleted here; the app does not use a
-- service-role Supabase Auth Admin client.

drop policy if exists "Admins can delete all contact messages" on public.admin_contact_messages;
create policy "Admins can delete all contact messages"
  on public.admin_contact_messages for delete
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can delete all leaderboard snapshots" on public.leaderboard_snapshots;
create policy "Admins can delete all leaderboard snapshots"
  on public.leaderboard_snapshots for delete
  to authenticated
  using (public.is_admin());
