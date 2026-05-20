create table if not exists public.statements (
  id bigint generated always as identity primary key,
  sort_order int not null,
  question text not null,
  answer_type text not null,
  options jsonb,
  correct_answer text,
  points int not null default 3,
  is_resolved boolean not null default false,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint statements_sort_order_range
    check (sort_order >= 1 and sort_order <= 15),
  constraint statements_points_fixed
    check (points = 3),
  constraint statements_answer_type_valid
    check (answer_type in (
      'yes_no', 'over_under', 'number',
      'player', 'team', 'text', 'multiple_choice'
    ))
);

drop trigger if exists set_statements_updated_at on public.statements;
create trigger set_statements_updated_at
  before update on public.statements
  for each row execute function public.set_updated_at();

alter table public.statements enable row level security;

drop policy if exists "Authenticated can read statements" on public.statements;
create policy "Authenticated can read statements"
  on public.statements for select to authenticated
  using (true);

drop policy if exists "Admins manage statements" on public.statements;
create policy "Admins manage statements"
  on public.statements for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
