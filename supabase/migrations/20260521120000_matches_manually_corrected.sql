-- Add manually_corrected flag to matches.
-- When an admin sets a result manually via the admin UI, this flag is set to true.
-- The nightly sync script skips any match with manually_corrected = true so it
-- never silently overwrites a human-verified result.
-- Admins can reset the flag via the "Tillad auto-sync" button in the admin UI.

alter table public.matches
  add column if not exists manually_corrected boolean not null default false;

comment on column public.matches.manually_corrected is
  'Set to true when an admin has manually entered/corrected the result. '
  'The auto-sync script will not overwrite matches with this flag set.';
