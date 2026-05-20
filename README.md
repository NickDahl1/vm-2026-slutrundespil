# VM 2026

VM 2026 er en mobil-first slutrundespil-app, hvor brugere kan oprette sig, logge ind, se kampe og følge leaderboard. Admins styrer kampdata og resultater direkte i appen.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth og Supabase database
- Vercel
- Dansk UI
- Mobil-first design

## Kør lokalt

Installer dependencies:

```bash
npm install
```

Start udviklingsserveren:

```bash
npm run dev
```

Åbn derefter:

```
http://localhost:3000
```

Kør lint:

```bash
npm run lint
```

Kør build:

```bash
npm run build
```

## Miljøvariabler

Opret en `.env.local` baseret på `.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Disse variabler skal også ligge i Vercel. Appen bruger kun Supabase public URL og anon key. Adgangskoder gemmes aldrig i appens database og håndteres kun af Supabase Auth.

## Supabase schema

Kør migrationerne i Supabase SQL Editor eller via Supabase CLI:

```bash
supabase db push
```

Migrationerne ligger i `supabase/migrations/` og køres i rækkefølge:

| Fil | Indhold |
|-----|---------|
| `20260520120000_auth_schema.sql` | profiles, app_settings, admin_messages, prizes, RLS |
| `20260520140000_matches.sql` | matches-tabel, constraints, RLS |
| `20260520150000_match_predictions.sql` | match_predictions-tabel, constraints, RLS |

## Database: matches

Tabellen `matches` indeholder alle VM-kampe.

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| `id` | bigint (identity) | Primærnøgle |
| `phase` | text | `group_stage` eller `knockout_stage` |
| `match_no` | int (unik) | Officielt kampnummer |
| `group_name` | text (nullable) | Gruppe, f.eks. `Gruppe A` |
| `home_team` | text | Hjemmeholdets navn |
| `away_team` | text | Udeholdets navn |
| `kickoff_at` | timestamptz | Afspark i UTC |
| `home_score_90` | int (nullable) | Hjemmemål efter 90 min |
| `away_score_90` | int (nullable) | Udemål efter 90 min |
| `status` | text | `scheduled`, `live`, `finished`, `postponed`, `cancelled` |
| `external_match_id` | text (nullable) | Til fremtidig API-integration |
| `created_at` | timestamptz | Oprettelsestidspunkt |
| `updated_at` | timestamptz | Sidst opdateret (auto-trigger) |

**Constraints:**
- `match_no` er unik
- `status` og `phase` valideres med check constraints
- Mål må ikke være negative

**RLS:**
- Alle indloggede brugere kan læse kampe
- Kun admins kan oprette, redigere og slette kampe

## Admin: kampstyrring

Gå til `/admin/matches` som admin for at:

- **Oprette kamp** — klik "Ny kamp", udfyld felter, gem
- **Redigere kamp** — klik "Rediger" på en kamp, ret felter, gem
- **Indtaste resultat** — rediger kampen, udfyld Hjemmemål og Udemål, sæt status til "Afsluttet"
- **Slette kamp** — klik "Slet", bekræft

Tidspunkter gemmes i UTC. Visning sker i UTC med label "UTC".

## Database: match_predictions

Tabellen `match_predictions` gemmer brugernes bud på kampresultater.

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| `id` | bigint (identity) | Primærnøgle |
| `user_id` | uuid | Reference til `profiles(id)` |
| `match_id` | bigint | Reference til `matches(id)` |
| `predicted_home_score` | int | Forudsagt hjemmemål |
| `predicted_away_score` | int | Forudsagt udemål |
| `points_home_score` | int | Point for korrekt hjemmemål (default 0) |
| `points_away_score` | int | Point for korrekt udemål (default 0) |
| `points_outcome` | int | Point for korrekt udfald (default 0) |
| `total_points` | int | Samlet pointsum (default 0) |
| `submitted_at` | timestamptz | Hvornår buddet første gang blev afgivet |
| `updated_at` | timestamptz | Sidst opdateret (auto-trigger) |

**Constraints:**
- Kombinationen `(user_id, match_id)` er unik — ét bud pr. bruger pr. kamp
- Alle scorer og point må ikke være negative

**RLS:**
- Brugere kan læse, oprette og opdatere egne bud
- Ingen kan slette bud (audit trail)
- Admins kan læse alle bud

## Kampbud: sådan fungerer det

Brugere afgiver bud på `/matches`. For hver kamp er der inputfelter til hjemme- og udemål.

**Lås-regler:**
- `app_settings.game_locked = true` → alle bud låst
- `app_settings.group_stage_lock_at < now()` → grundspilsbud låst
- `app_settings.knockout_stage_lock_at < now()` → slutspilsbud låst

Lås-tjek sker både i server action (sikkerhed) og i klienten (visning). Er en kamp låst, vises brugerens bud som tekst frem for redigerbare felter.

**Sæt deadline for grundspil:**
```sql
update public.app_settings
set group_stage_lock_at = '2026-06-11T16:00:00+00:00'
where id = 'global';
```

**Lås spillet manuelt:**
```sql
update public.app_settings
set game_locked = true
where id = 'global';
```

## Pointregler for kampbud

Point beregnes kun når `match.status = 'finished'` og begge scorer er udfyldt.

| Betingelse | Point |
|-----------|-------|
| Predicted hjemmemål = faktisk hjemmemål | 1 |
| Predicted udemål = faktisk udemål | 1 |
| Korrekt udfald (hjemmesejer / uafgjort / udesejer) | 1 |
| **Maks pr. kamp** | **3** |

Ingen ekstra point for perfekt resultat. Ingen minuspoint. Ingen point for måldifference.

**Eksempler:**

| Bud | Resultat | Point |
|-----|---------|-------|
| 2-1 | 2-1 | 3 |
| 2-1 | 3-1 | 2 |
| 2-1 | 2-2 | 1 |
| 2-1 | 0-1 | 1 |
| 2-1 | 1-2 | 0 |
| 0-0 | 0-0 | 3 |
| 1-1 | 2-2 | 1 |

Pointlogikken ligger i `src/lib/scoring.ts` og er dækket af unit tests (`npm run test`).

## Genberegn point

Point beregnes automatisk, når admin gemmer et resultat med status "Afsluttet".

Genberegn alle færdige kampe manuelt fra `/admin/matches` → knappen "Genberegn point for alle færdige kampe".

Via SQL (nødvendigt kun hvis der er lavet direkte DB-rettelser):
```sql
-- Brug knappen i admin-UI i stedet for manuel SQL
```

## Gør en bruger til admin

```sql
update public.profiles
set is_admin = true
where id = 'USER_UUID_HER';
```

Du finder brugerens UUID i Supabase Auth Users eller i `public.profiles`.

## Leaderboard

Leaderboard vises på `/leaderboard` og er tilgængeligt for alle indloggede brugere.

### Database: leaderboard_view

Migrationen `20260520190000_leaderboard_view_v2.sql` erstatter den originale view og tilføjer udsagns-point. Den bruger subquery-joins for at undgå kartesisk produkt.

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| `user_id` | uuid | Brugerens id |
| `display_name` | text | Brugerens visningsnavn |
| `match_points` | int | Point fra kampbud |
| `statement_points` | int | Point fra udsagnssvar |
| `total_points` | int | `match_points + statement_points` |
| `perfect_results` | int | Antal kampbud med 3 point |
| `correct_outcomes` | int | Antal bud med korrekt udfald |
| `predictions_count` | int | Antal afgivne kampbud |
| `statement_answers_count` | int | Antal afgivne udsagnssvar |
| `rank` | int | Placering beregnet med tie-breaker |

Viewet ejes af `postgres` og kører med view-ejerens rettigheder (bypasser RLS), så alle brugeres point kan aggregeres korrekt. `SELECT` er kun tildelt `authenticated`-rollen.

### Tie-breaker

Placeringer rangeres i denne rækkefølge:

1. Flest `total_points` (faldende)
2. Flest `match_points` (faldende)
3. Flest `perfect_results` (faldende)
4. Flest `correct_outcomes` (faldende)
5. `display_name` alfabetisk (stigende)

### Brugerdetaljer

Klik på en spiller på `/leaderboard` for at se `/leaderboard/[user_id]` med:
- Sammenfatning: total point, kampe, perfekte, udfald
- Filtreringstabs: Alle / Pointgivende / Perfekte / Ingen point / Gruppespil / Slutspil
- Per-kamp kort: resultat vs bud, ✓/✗ badges for hjemmemål/udemål/udfald
- Desktop: 2-kolonne grid

Bud på igangværende eller planlagte kampe vises ikke (kun afsluttede kampe).

### RLS: synlighed af bud

Migrationen `20260520160000_leaderboard_view.sql` tilføjer en SELECT-policy på `match_predictions`:
- Alle indloggede brugere kan læse bud for **afsluttede** kampe (til leaderboard-detaljevisning)
- Egne bud kan altid læses uanset kampstatus (eksisterende policy)

## Database: statements

Migrationen `20260520170000_statements.sql` opretter tabellen `public.statements`.

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| `id` | bigint (identity) | Primærnøgle |
| `sort_order` | int | Visningsrækkefølge (1–15) |
| `question` | text | Udsagnets spørgsmålstekst |
| `answer_type` | text | `yes_no`, `over_under`, `number`, `player`, `team`, `text`, `multiple_choice` |
| `options` | jsonb | Array af svarmuligheder (kun `multiple_choice`) |
| `correct_answer` | text | Korrekt svar (udfyldes ved afgørelse) |
| `points` | int | Altid 3 |
| `is_resolved` | boolean | Om udsagnet er afgjort |
| `resolved_at` | timestamptz | Hvornår det blev afgjort |

**RLS:**
- Alle indloggede brugere kan læse udsagn
- Kun admins kan oprette, redigere og slette udsagn

## Database: statement_predictions

Migrationen `20260520180000_statement_predictions.sql` opretter `public.statement_predictions`.

| Kolonne | Type | Beskrivelse |
|---------|------|-------------|
| `id` | bigint (identity) | Primærnøgle |
| `user_id` | uuid | Reference til `profiles(id)` |
| `statement_id` | bigint | Reference til `statements(id)` |
| `answer` | text | Brugerens svar |
| `points` | int | 0 eller 3 (beregnes ved afgørelse) |

**Constraints:**
- Unik `(user_id, statement_id)`
- `points` mellem 0 og 3

**RLS:**
- Brugere kan læse, oprette og opdatere egne svar
- Ingen kan slette svar (audit trail)
- Admins kan læse og opdatere alle svar

## Udsagn: sådan fungerer det

Brugere besvarer udsagn på `/statements` inden deadline (samme som `app_settings.group_stage_lock_at`).

**Svartyper:**
| Type | UI | Eksempel |
|------|-----|---------|
| `yes_no` | Ja/Nej toggle | "Går Danmark videre?" |
| `over_under` | Over/Under toggle | "Scores der over 100 mål?" |
| `number` | Tal-input | "Hvor mange mål i alt?" |
| `player` | Tekst-input | "Hvem bliver topscorer?" |
| `team` | Tekst-input | "Hvem vinder VM?" |
| `text` | Tekst-input | Fritekst |
| `multiple_choice` | Dropdown | Valgmuligheder fra `options`-feltet |

**Pointregler:**
- Korrekt svar = 3 point
- Forkert svar = 0 point
- Sammenligning er case-insensitiv og whitespace-trimmet

**Admin-afgørelse:**
Admin går til `/admin/statements`, klikker "Afgør" på et udsagn, angiver det korrekte svar og klikker "Afgør og beregn point". Point beregnes automatisk for alle deltagere.

## Forslag til 15 udsagn

Disse kan indsættes manuelt via `/admin/statements`. De første 11 kan automatiseres ud fra kampdata; de sidste 4 kræver detaljeret kampstatistik.

| # | Spørgsmål | Type | Kan automatiseres |
|---|-----------|------|-------------------|
| 1 | Bliver der scoret over 100 mål i turneringen? | over_under | Ja |
| 2 | Scorer Danmark mindst 5 mål i gruppespillet? | over_under | Ja |
| 3 | Går Danmark videre fra gruppen? | yes_no | Ja |
| 4 | Bliver finalen afgjort efter 90 minutter? | yes_no | Ja |
| 5 | Kommer der mindst én 0-0 kamp? | yes_no | Ja |
| 6 | Kommer der mindst én kamp med 5 eller flere mål? | yes_no | Ja |
| 7 | Kommer der mindst én kamp hvor et hold scorer 4+ mål? | yes_no | Ja |
| 8 | Bliver der flere end 10 uafgjorte kampe i gruppespillet? | over_under | Ja |
| 9 | Kommer der mindst én kamp hvor et hold vinder med 3+ mål? | yes_no | Ja |
| 10 | Scorer begge hold i åbningskampen? | yes_no | Ja |
| 11 | Bliver vinderen fra Europa? | yes_no | Ja |
| 12 | Bliver der scoret flere mål i 2. end 1. halvleg? | yes_no | Kræver halvlegsdata |
| 13 | Bliver der over 5 straffespark i turneringen? | over_under | Kræver detaljeret data |
| 14 | Bliver der over 5 røde kort i turneringen? | over_under | Kræver detaljeret data |
| 15 | Hvem vinder VM 2026? | team | Ja |

Pointlogikken for udsagn ligger i `src/lib/statement-scoring.ts` og er dækket af unit tests (`npm run test`).
