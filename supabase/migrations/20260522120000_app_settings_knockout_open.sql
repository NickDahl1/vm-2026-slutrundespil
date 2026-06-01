-- ── knockout_predictions_open ─────────────────────────────────────────────────
-- Controls whether users can submit/edit predictions on knockout-stage matches.
-- Default FALSE: knockout bids are closed until admin opens them after the
-- group stage is complete and the bracket is known.
--
-- Existing rows: add_column with DEFAULT FALSE is a safe metadata-only change
-- that does not touch any prediction rows.

alter table public.app_settings
  add column if not exists knockout_predictions_open boolean not null default false;
