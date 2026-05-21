-- VM 2026 Slutrundespil — default statements seed
-- =====================================================
-- IDEMPOTENT: Uses ON CONFLICT (sort_order) to upsert.
-- Requires migration 20260521140000_statements_sort_order_unique.sql to be applied first.
--
-- SAFE: Only updates sort_order, question, answer_type and points.
--       Does NOT touch correct_answer, is_resolved or resolved_at.
--       Does NOT delete or modify statement_predictions (user answers).
--
-- HOW TO RUN:
--   In the Supabase dashboard → SQL Editor → paste this file and run.
--   Or: supabase db push (if using local dev with supabase CLI).
--
-- After running, verify with:
--   SELECT sort_order, question, answer_type, points FROM statements ORDER BY sort_order;

insert into public.statements (sort_order, question, answer_type, points, is_resolved)
values
  (1,  'Bliver der scoret over 100 mål i hele turneringen?',                       'over_under', 3, false),
  (2,  'Bliver der scoret over 40 mål i gruppespillet?',                            'over_under', 3, false),
  (3,  'Kommer der mindst én kamp, der ender 0-0?',                                'yes_no',     3, false),
  (4,  'Kommer der mindst én kamp med 5 eller flere mål?',                          'yes_no',     3, false),
  (5,  'Kommer der mindst én kamp, hvor et hold scorer 4 eller flere mål?',         'yes_no',     3, false),
  (6,  'Bliver der flere end 10 uafgjorte kampe i gruppespillet?',                  'yes_no',     3, false),
  (7,  'Scorer Danmark mindst 5 mål i gruppespillet?',                              'yes_no',     3, false),
  (8,  'Går Danmark videre fra gruppen?',                                            'yes_no',     3, false),
  (9,  'Bliver finalen afgjort efter 90 minutter?',                                 'yes_no',     3, false),
  (10, 'Bliver der scoret af begge hold i åbningskampen?',                          'yes_no',     3, false),
  (11, 'Kommer der mindst én kamp, hvor et hold vinder med 3 eller flere mål?',     'yes_no',     3, false),
  (12, 'Hvilket hold scorer flest mål i gruppespillet?',                            'team',       3, false),
  (13, 'Hvilket hold lukker færrest mål ind i gruppespillet?',                      'team',       3, false),
  (14, 'Bliver der flere hjemmesejre end udesejre i gruppespillet?',                'yes_no',     3, false),
  (15, 'Bliver vinderen fra Europa?',                                               'yes_no',     3, false)
on conflict (sort_order) do update set
  question    = excluded.question,
  answer_type = excluded.answer_type,
  points      = excluded.points,
  updated_at  = now()
where
  -- Only update unresolved statements to avoid overwriting decided answers
  statements.is_resolved = false;
