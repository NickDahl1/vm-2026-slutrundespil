-- Admin contact messages — users can write to admin from within the app.

create table if not exists public.admin_contact_messages (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  subject    text not null,
  message    text not null,
  status     text not null default 'new',
  created_at timestamp with time zone not null default now(),
  read_at    timestamp with time zone,

  constraint admin_contact_messages_subject_nonempty
    check (char_length(trim(subject)) > 0),
  constraint admin_contact_messages_message_nonempty
    check (char_length(trim(message)) > 0),
  constraint admin_contact_messages_status_valid
    check (status in ('new', 'read', 'archived'))
);

create index if not exists admin_contact_messages_user_id_idx
  on public.admin_contact_messages (user_id);
create index if not exists admin_contact_messages_status_idx
  on public.admin_contact_messages (status);

alter table public.admin_contact_messages enable row level security;

-- Users can create messages (own)
drop policy if exists "Users can insert own messages" on public.admin_contact_messages;
create policy "Users can insert own messages"
  on public.admin_contact_messages for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can read own messages
drop policy if exists "Users can read own messages" on public.admin_contact_messages;
create policy "Users can read own messages"
  on public.admin_contact_messages for select
  to authenticated
  using (auth.uid() = user_id);

-- Admins can read all messages
drop policy if exists "Admins can read all messages" on public.admin_contact_messages;
create policy "Admins can read all messages"
  on public.admin_contact_messages for select
  to authenticated
  using (public.is_admin());

-- Admins can update status (mark as read / archive)
drop policy if exists "Admins can update message status" on public.admin_contact_messages;
create policy "Admins can update message status"
  on public.admin_contact_messages for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
