-- VM 2026 kampprogram — alle 104 kampe
-- Kilde: Sky Sports / FIFA officiel kampplan (tider i UK BST = UTC+1, konverteret til UTC)
-- Idempotent: kør frit flere gange — opdaterer eksisterende rækker på match_no conflict.
-- Sletter IKKE eksisterende brugerbud eller andre rækker.

insert into public.matches (
  match_no,
  phase,
  group_name,
  home_team,
  away_team,
  kickoff_at,
  status
)
values
  -- =========================================================
  -- GRUPPESPIL — Runde 1
  -- =========================================================
  -- Gruppe A
  (1,  'group_stage', 'Gruppe A', 'Mexico',          'Sydafrika',       '2026-06-11T19:00:00Z', 'scheduled'),
  (2,  'group_stage', 'Gruppe A', 'Sydkorea',         'Tjekkiet',        '2026-06-12T02:00:00Z', 'scheduled'),
  -- Gruppe B
  (3,  'group_stage', 'Gruppe B', 'Canada',           'Bosnien-Hercegovina', '2026-06-12T19:00:00Z', 'scheduled'),
  (5,  'group_stage', 'Gruppe B', 'Qatar',            'Schweiz',         '2026-06-13T19:00:00Z', 'scheduled'),
  -- Gruppe C
  (6,  'group_stage', 'Gruppe C', 'Brasilien',        'Marokko',         '2026-06-13T22:00:00Z', 'scheduled'),
  (7,  'group_stage', 'Gruppe C', 'Haiti',            'Skotland',        '2026-06-14T01:00:00Z', 'scheduled'),
  -- Gruppe D
  (4,  'group_stage', 'Gruppe D', 'USA',              'Paraguay',        '2026-06-13T01:00:00Z', 'scheduled'),
  (8,  'group_stage', 'Gruppe D', 'Australien',       'Tyrkiet',         '2026-06-14T04:00:00Z', 'scheduled'),
  -- Gruppe E
  (9,  'group_stage', 'Gruppe E', 'Tyskland',         'Curaçao',         '2026-06-14T17:00:00Z', 'scheduled'),
  (11, 'group_stage', 'Gruppe E', 'Elfenbenskysten',  'Ecuador',         '2026-06-14T23:00:00Z', 'scheduled'),
  -- Gruppe F
  (10, 'group_stage', 'Gruppe F', 'Holland',          'Japan',           '2026-06-14T20:00:00Z', 'scheduled'),
  (12, 'group_stage', 'Gruppe F', 'Sverige',          'Tunesien',        '2026-06-15T02:00:00Z', 'scheduled'),
  -- Gruppe G
  (14, 'group_stage', 'Gruppe G', 'Belgien',          'Egypten',         '2026-06-15T19:00:00Z', 'scheduled'),
  (16, 'group_stage', 'Gruppe G', 'Iran',             'New Zealand',     '2026-06-16T01:00:00Z', 'scheduled'),
  -- Gruppe H
  (13, 'group_stage', 'Gruppe H', 'Spanien',          'Kap Verde',       '2026-06-15T16:00:00Z', 'scheduled'),
  (15, 'group_stage', 'Gruppe H', 'Saudi-Arabien',    'Uruguay',         '2026-06-15T22:00:00Z', 'scheduled'),
  -- Gruppe I
  (17, 'group_stage', 'Gruppe I', 'Frankrig',         'Senegal',         '2026-06-16T19:00:00Z', 'scheduled'),
  (18, 'group_stage', 'Gruppe I', 'Irak',             'Norge',           '2026-06-16T22:00:00Z', 'scheduled'),
  -- Gruppe J
  (19, 'group_stage', 'Gruppe J', 'Argentina',        'Algeriet',        '2026-06-17T01:00:00Z', 'scheduled'),
  (20, 'group_stage', 'Gruppe J', 'Østrig',           'Jordan',          '2026-06-17T04:00:00Z', 'scheduled'),
  -- Gruppe K
  (21, 'group_stage', 'Gruppe K', 'Portugal',         'DR Congo',        '2026-06-17T17:00:00Z', 'scheduled'),
  (24, 'group_stage', 'Gruppe K', 'Usbekistan',       'Colombia',        '2026-06-18T02:00:00Z', 'scheduled'),
  -- Gruppe L
  (22, 'group_stage', 'Gruppe L', 'England',          'Kroatien',        '2026-06-17T20:00:00Z', 'scheduled'),
  (23, 'group_stage', 'Gruppe L', 'Ghana',            'Panama',          '2026-06-17T23:00:00Z', 'scheduled'),

  -- =========================================================
  -- GRUPPESPIL — Runde 2
  -- =========================================================
  -- Gruppe A
  (25, 'group_stage', 'Gruppe A', 'Tjekkiet',         'Sydafrika',       '2026-06-18T16:00:00Z', 'scheduled'),
  (28, 'group_stage', 'Gruppe A', 'Mexico',            'Sydkorea',        '2026-06-19T01:00:00Z', 'scheduled'),
  -- Gruppe B
  (26, 'group_stage', 'Gruppe B', 'Schweiz',          'Bosnien-Hercegovina', '2026-06-18T19:00:00Z', 'scheduled'),
  (27, 'group_stage', 'Gruppe B', 'Canada',           'Qatar',           '2026-06-18T22:00:00Z', 'scheduled'),
  -- Gruppe C
  (30, 'group_stage', 'Gruppe C', 'Skotland',         'Marokko',         '2026-06-19T22:00:00Z', 'scheduled'),
  (31, 'group_stage', 'Gruppe C', 'Brasilien',        'Haiti',           '2026-06-20T00:30:00Z', 'scheduled'),
  -- Gruppe D
  (29, 'group_stage', 'Gruppe D', 'USA',              'Australien',      '2026-06-19T19:00:00Z', 'scheduled'),
  (32, 'group_stage', 'Gruppe D', 'Tyrkiet',          'Paraguay',        '2026-06-20T03:00:00Z', 'scheduled'),
  -- Gruppe E
  (34, 'group_stage', 'Gruppe E', 'Tyskland',         'Elfenbenskysten', '2026-06-20T20:00:00Z', 'scheduled'),
  (35, 'group_stage', 'Gruppe E', 'Ecuador',          'Curaçao',         '2026-06-21T00:00:00Z', 'scheduled'),
  -- Gruppe F
  (33, 'group_stage', 'Gruppe F', 'Holland',          'Sverige',         '2026-06-20T17:00:00Z', 'scheduled'),
  (36, 'group_stage', 'Gruppe F', 'Tunesien',         'Japan',           '2026-06-21T04:00:00Z', 'scheduled'),
  -- Gruppe G
  (38, 'group_stage', 'Gruppe G', 'Belgien',          'Iran',            '2026-06-21T19:00:00Z', 'scheduled'),
  (40, 'group_stage', 'Gruppe G', 'New Zealand',      'Egypten',         '2026-06-22T01:00:00Z', 'scheduled'),
  -- Gruppe H
  (37, 'group_stage', 'Gruppe H', 'Spanien',          'Saudi-Arabien',   '2026-06-21T16:00:00Z', 'scheduled'),
  (39, 'group_stage', 'Gruppe H', 'Uruguay',          'Kap Verde',       '2026-06-21T22:00:00Z', 'scheduled'),
  -- Gruppe I
  (42, 'group_stage', 'Gruppe I', 'Frankrig',         'Irak',            '2026-06-22T21:00:00Z', 'scheduled'),
  (43, 'group_stage', 'Gruppe I', 'Norge',            'Senegal',         '2026-06-23T00:00:00Z', 'scheduled'),
  -- Gruppe J
  (41, 'group_stage', 'Gruppe J', 'Argentina',        'Østrig',          '2026-06-22T17:00:00Z', 'scheduled'),
  (44, 'group_stage', 'Gruppe J', 'Jordan',           'Algeriet',        '2026-06-23T03:00:00Z', 'scheduled'),
  -- Gruppe K
  (45, 'group_stage', 'Gruppe K', 'Portugal',         'Usbekistan',      '2026-06-23T17:00:00Z', 'scheduled'),
  (48, 'group_stage', 'Gruppe K', 'Colombia',         'DR Congo',        '2026-06-24T02:00:00Z', 'scheduled'),
  -- Gruppe L
  (46, 'group_stage', 'Gruppe L', 'England',          'Ghana',           '2026-06-23T20:00:00Z', 'scheduled'),
  (47, 'group_stage', 'Gruppe L', 'Panama',           'Kroatien',        '2026-06-23T23:00:00Z', 'scheduled'),

  -- =========================================================
  -- GRUPPESPIL — Runde 3 (parallelle kampe)
  -- =========================================================
  -- Gruppe A (simultane)
  (53, 'group_stage', 'Gruppe A', 'Sydafrika',        'Sydkorea',        '2026-06-25T01:00:00Z', 'scheduled'),
  (54, 'group_stage', 'Gruppe A', 'Tjekkiet',         'Mexico',          '2026-06-25T01:00:00Z', 'scheduled'),
  -- Gruppe B (simultane)
  (49, 'group_stage', 'Gruppe B', 'Schweiz',          'Canada',          '2026-06-24T19:00:00Z', 'scheduled'),
  (50, 'group_stage', 'Gruppe B', 'Bosnien-Hercegovina', 'Qatar',        '2026-06-24T19:00:00Z', 'scheduled'),
  -- Gruppe C (simultane)
  (51, 'group_stage', 'Gruppe C', 'Marokko',          'Haiti',           '2026-06-24T22:00:00Z', 'scheduled'),
  (52, 'group_stage', 'Gruppe C', 'Skotland',         'Brasilien',       '2026-06-24T22:00:00Z', 'scheduled'),
  -- Gruppe D (simultane)
  (59, 'group_stage', 'Gruppe D', 'Tyrkiet',          'USA',             '2026-06-26T02:00:00Z', 'scheduled'),
  (60, 'group_stage', 'Gruppe D', 'Paraguay',         'Australien',      '2026-06-26T02:00:00Z', 'scheduled'),
  -- Gruppe E (simultane)
  (55, 'group_stage', 'Gruppe E', 'Curaçao',          'Elfenbenskysten', '2026-06-25T20:00:00Z', 'scheduled'),
  (56, 'group_stage', 'Gruppe E', 'Ecuador',          'Tyskland',        '2026-06-25T20:00:00Z', 'scheduled'),
  -- Gruppe F (simultane)
  (57, 'group_stage', 'Gruppe F', 'Tunesien',         'Holland',         '2026-06-25T23:00:00Z', 'scheduled'),
  (58, 'group_stage', 'Gruppe F', 'Japan',            'Sverige',         '2026-06-25T23:00:00Z', 'scheduled'),
  -- Gruppe G (simultane)
  (65, 'group_stage', 'Gruppe G', 'New Zealand',      'Belgien',         '2026-06-27T03:00:00Z', 'scheduled'),
  (66, 'group_stage', 'Gruppe G', 'Egypten',          'Iran',            '2026-06-27T03:00:00Z', 'scheduled'),
  -- Gruppe H (simultane)
  (63, 'group_stage', 'Gruppe H', 'Kap Verde',        'Saudi-Arabien',   '2026-06-27T00:00:00Z', 'scheduled'),
  (64, 'group_stage', 'Gruppe H', 'Uruguay',          'Spanien',         '2026-06-27T00:00:00Z', 'scheduled'),
  -- Gruppe I (simultane)
  (61, 'group_stage', 'Gruppe I', 'Norge',            'Frankrig',        '2026-06-26T19:00:00Z', 'scheduled'),
  (62, 'group_stage', 'Gruppe I', 'Senegal',          'Irak',            '2026-06-26T19:00:00Z', 'scheduled'),
  -- Gruppe J (simultane)
  (71, 'group_stage', 'Gruppe J', 'Algeriet',         'Østrig',          '2026-06-28T02:00:00Z', 'scheduled'),
  (72, 'group_stage', 'Gruppe J', 'Jordan',           'Argentina',       '2026-06-28T02:00:00Z', 'scheduled'),
  -- Gruppe K (simultane)
  (69, 'group_stage', 'Gruppe K', 'Colombia',         'Portugal',        '2026-06-27T23:30:00Z', 'scheduled'),
  (70, 'group_stage', 'Gruppe K', 'DR Congo',         'Usbekistan',      '2026-06-27T23:30:00Z', 'scheduled'),
  -- Gruppe L (simultane)
  (67, 'group_stage', 'Gruppe L', 'Panama',           'England',         '2026-06-27T21:00:00Z', 'scheduled'),
  (68, 'group_stage', 'Gruppe L', 'Kroatien',         'Ghana',           '2026-06-27T21:00:00Z', 'scheduled'),

  -- =========================================================
  -- SLUTSPIL — 1/16-finaler (Round of 32)
  -- =========================================================
  (73, 'knockout_stage', null, '2. Gruppe A',         '2. Gruppe B',           '2026-06-28T19:00:00Z', 'scheduled'),
  (76, 'knockout_stage', null, '1. Gruppe C',         '2. Gruppe F',           '2026-06-29T17:00:00Z', 'scheduled'),
  (74, 'knockout_stage', null, '1. Gruppe E',         'Bedste 3er (A/B/C/D/F)','2026-06-29T20:30:00Z', 'scheduled'),
  (75, 'knockout_stage', null, '1. Gruppe F',         '2. Gruppe C',           '2026-06-30T01:00:00Z', 'scheduled'),
  (78, 'knockout_stage', null, '2. Gruppe E',         '2. Gruppe I',           '2026-06-30T17:00:00Z', 'scheduled'),
  (77, 'knockout_stage', null, '1. Gruppe I',         'Bedste 3er (C/D/F/G/H)','2026-06-30T21:00:00Z', 'scheduled'),
  (79, 'knockout_stage', null, '1. Gruppe A',         'Bedste 3er (C/E/F/H/I)','2026-07-01T01:00:00Z', 'scheduled'),
  (82, 'knockout_stage', null, '1. Gruppe G',         'Bedste 3er (A/E/H/I/J)','2026-07-01T20:00:00Z', 'scheduled'),
  (80, 'knockout_stage', null, '1. Gruppe L',         'Bedste 3er (E/H/I/J/K)','2026-07-01T16:00:00Z', 'scheduled'),
  (84, 'knockout_stage', null, '1. Gruppe H',         '2. Gruppe J',           '2026-07-02T19:00:00Z', 'scheduled'),
  (81, 'knockout_stage', null, '1. Gruppe D',         'Bedste 3er (B/E/F/I/J)','2026-07-02T00:00:00Z', 'scheduled'),
  (83, 'knockout_stage', null, '2. Gruppe K',         '2. Gruppe L',           '2026-07-02T23:00:00Z', 'scheduled'),
  (88, 'knockout_stage', null, '2. Gruppe D',         '2. Gruppe G',           '2026-07-03T18:00:00Z', 'scheduled'),
  (85, 'knockout_stage', null, '1. Gruppe B',         'Bedste 3er (E/F/G/I/J)','2026-07-03T03:00:00Z', 'scheduled'),
  (86, 'knockout_stage', null, '1. Gruppe J',         '2. Gruppe H',           '2026-07-03T22:00:00Z', 'scheduled'),
  (87, 'knockout_stage', null, '1. Gruppe K',         'Bedste 3er (D/E/I/J/L)','2026-07-04T01:30:00Z', 'scheduled'),

  -- =========================================================
  -- SLUTSPIL — 1/8-finaler (Round of 16)
  -- =========================================================
  (90, 'knockout_stage', null, 'Vinder kamp 73',      'Vinder kamp 75',        '2026-07-04T17:00:00Z', 'scheduled'),
  (89, 'knockout_stage', null, 'Vinder kamp 74',      'Vinder kamp 77',        '2026-07-04T21:00:00Z', 'scheduled'),
  (91, 'knockout_stage', null, 'Vinder kamp 76',      'Vinder kamp 78',        '2026-07-05T20:00:00Z', 'scheduled'),
  (92, 'knockout_stage', null, 'Vinder kamp 79',      'Vinder kamp 80',        '2026-07-06T00:00:00Z', 'scheduled'),
  (93, 'knockout_stage', null, 'Vinder kamp 83',      'Vinder kamp 84',        '2026-07-06T19:00:00Z', 'scheduled'),
  (94, 'knockout_stage', null, 'Vinder kamp 81',      'Vinder kamp 82',        '2026-07-07T00:00:00Z', 'scheduled'),
  (95, 'knockout_stage', null, 'Vinder kamp 86',      'Vinder kamp 88',        '2026-07-07T16:00:00Z', 'scheduled'),
  (96, 'knockout_stage', null, 'Vinder kamp 85',      'Vinder kamp 87',        '2026-07-07T20:00:00Z', 'scheduled'),

  -- =========================================================
  -- SLUTSPIL — Kvartfinaler
  -- =========================================================
  (97,  'knockout_stage', null, 'Vinder kamp 89',     'Vinder kamp 90',        '2026-07-09T20:00:00Z', 'scheduled'),
  (98,  'knockout_stage', null, 'Vinder kamp 93',     'Vinder kamp 94',        '2026-07-10T19:00:00Z', 'scheduled'),
  (99,  'knockout_stage', null, 'Vinder kamp 91',     'Vinder kamp 92',        '2026-07-11T21:00:00Z', 'scheduled'),
  (100, 'knockout_stage', null, 'Vinder kamp 95',     'Vinder kamp 96',        '2026-07-12T01:00:00Z', 'scheduled'),

  -- =========================================================
  -- SLUTSPIL — Semifinaler
  -- =========================================================
  (101, 'knockout_stage', null, 'Vinder kamp 97',     'Vinder kamp 98',        '2026-07-14T19:00:00Z', 'scheduled'),
  (102, 'knockout_stage', null, 'Vinder kamp 99',     'Vinder kamp 100',       '2026-07-15T19:00:00Z', 'scheduled'),

  -- =========================================================
  -- SLUTSPIL — Bronzekamp og Finale
  -- =========================================================
  (103, 'knockout_stage', null, 'Taber kamp 101',     'Taber kamp 102',        '2026-07-18T21:00:00Z', 'scheduled'),
  (104, 'knockout_stage', null, 'Vinder kamp 101',    'Vinder kamp 102',       '2026-07-19T19:00:00Z', 'scheduled')

on conflict (match_no) do update set
  phase            = excluded.phase,
  group_name       = excluded.group_name,
  home_team        = excluded.home_team,
  away_team        = excluded.away_team,
  kickoff_at       = excluded.kickoff_at,
  status           = excluded.status,
  updated_at       = now();
