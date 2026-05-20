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
