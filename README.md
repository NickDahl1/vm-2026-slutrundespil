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

## Automatisk resultatopdatering

Kampresultater opdateres automatisk via et **GitHub Actions cron-job** der kører dagligt kl. 08:00 dansk tid (06:00 UTC).

### Hvordan det virker

```
GitHub Actions (kl. 08:00 CEST / 06:00 UTC)
  → scripts/sync-results.ts
    → Henter kampresultater fra datakilde (API eller mock)
    → Matcher mod matches-tabellen via external_match_id eller match_no
    → Opdaterer home_score_90, away_score_90, status = "finished"
    → Genberegner point for alle bud på opdaterede kampe
    → Logger hvad der blev opdateret og hvad der blev sprunget over
```

### Sikkerhedsregler

| Situation | Hvad scriptet gør |
|---|---|
| Kamp har `manually_corrected = true` | **Springer over** — admin-rettet resultat er ground truth |
| Kamp er `postponed` eller `cancelled` | Springer over — rør ikke disse |
| Ekstern data har `isFinished = false` | Springer over — live/ufærdig kamp |
| Ugyldig score (null, negativ, decimal) | Springer over + logger advarsel |
| Kamp allerede opdateret med samme resultat | Springer over — idempotent |
| Ny eller ændret score | Opdaterer + genberegner point |

### Manuel kontrol / manuelt rettede resultater

Når en admin gemmer et kampresultat via `/admin/matches` sættes `manually_corrected = true` automatisk. Det betyder at auto-sync **aldrig overskriver** resultatet bagefter.

Vil du re-aktivere auto-sync for en kamp (fx fordi du har rettet en fejl), klik **"Tillad auto-sync"** på kampkortet i admin-panelet.

### Datakilde — nuværende status

**Aktuelt: Ingen datakilde konfigureret — det er fint**

> 🔒 **Scriptet stopper sikkert uden API-nøgle.** Ingen databaseændringer foretages. Dette er den forventede adfærd, og GitHub Actions kræver ingen nøgle for at starte.

VM 2026 starter juni 2026. Indtil `FOOTBALL_API_KEY` er sat, afslutter scriptet med:

```
No real API key configured. Exiting without changes.
```

**Hvad det betyder i praksis:**
- Resultater opdateres **ikke automatisk** — admin retter resultater manuelt på `/admin/matches`
- GitHub Actions kører dagligt, men gør ingenting uden nøgle (ingen fejl, ingen databaseændringer)
- Når turneringen starter: sæt `FOOTBALL_API_KEY` i GitHub Secrets (se nedenfor)
- `/admin/release` viser auto-sync status baseret på om nøglen er konfigureret

**Planlagt API: football-data.org (gratis plan)**
- 10 req/min, dækker FIFA World Cup, ingen registrering med betalingskort
- Endpoint: `GET /v4/competitions/WC/matches?season=2026&status=FINISHED`
- Stable match-IDs der mappes til `matches.external_match_id`

Se `scripts/adapters/football-data.ts` for implementeringsvejledning og kodetemplate.

> ⚠️ **MockAdapter er ikke et fallback for GitHub Actions.**
> Mock bruges kun, når `USE_MOCK=true` er sat eksplicit. Sæt aldrig `USE_MOCK=true` i GitHub Actions uden `DRY_RUN=false` (scriptet tvinger `DRY_RUN=true` automatisk hvis du glemmer det).

### GitHub Secrets

Sæt disse i **Settings → Secrets and variables → Actions**:

| Secret | Beskrivelse | Krævet |
|---|---|---|
| `SUPABASE_URL` | Supabase projekt-URL, fx `https://xxx.supabase.co` | Ja |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key fra Supabase → Settings → API | Ja |
| `FOOTBALL_API_KEY` | API-nøgle fra football-data.org (gratis) | Nej — brug mock indtil turneringen starter |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` omgår RLS og har fuld adgang til databasen.
> Den må **aldrig** eksponeres i browseren, i klientkode eller committes til Git.

### Køre sync-jobbet manuelt

**Via GitHub Actions UI:**
1. Gå til **Actions → Sync VM 2026 Results**
2. Klik **Run workflow**
3. Vælg evt. `dry_run=true` — logger hvad der ville ske, uden at skrive til databasen
4. Vælg evt. `use_mock=true` — bruger `scripts/mock-results.json` frem for API

**Lokalt:**
```bash
# Dry-run med mock-data — ingen database nødvendig, DRY_RUN er automatisk true:
USE_MOCK=true npm run sync:results

# Dry-run mod rigtig database (ser hvad der VILLE ske, ingen ændringer):
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
USE_MOCK=true \
npm run sync:results

# Skriv mock-data til rigtig database (intentionel, kræver eksplicit DRY_RUN=false):
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
USE_MOCK=true DRY_RUN=false \
npm run sync:results

# Rigtig kørsel med football-data.org (når implementeret):
SUPABASE_URL=https://xxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJ... \
FOOTBALL_API_KEY=din-nøgle \
npm run sync:results
```

### Hvad opdateres automatisk

- `matches.home_score_90` og `away_score_90` — mål efter 90 minutter
- `matches.status` → `"finished"`
- `match_predictions.points_*` og `total_points` — genberegnes for alle bud

**Opdateres IKKE automatisk:**
- Forlænget spilletid / straffespark (spillet bruger kun 90-minutters resultat)
- Udsagn/bonus-svar — afgøres manuelt af admin
- Kampe med `manually_corrected = true`

### Tilpasning til nyt API

1. Opret `scripts/adapters/mit-api.ts` og implementér `MatchResultAdapter`-interfacet
2. Brug adapteren i `scripts/sync-results.ts` (der hvor adapteren vælges)
3. Tilføj evt. ny env-variabel til `.env.example` og GitHub Secrets

---

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
| `external_match_id` | text (nullable) | Stabilt ID fra ekstern datakilde — bruges af auto-sync |
| `manually_corrected` | boolean | `true` hvis admin har rettet resultatet manuelt — auto-sync springer disse over |
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

## De 15 standardudsagn (seed-fil)

De 15 udsagn er klar i en idempotent seed-fil:

```
supabase/seed/2026_default_statements.sql
```

**Kør seed-filen:**
1. Åbn Supabase Dashboard → SQL Editor
2. Indsæt indholdet af filen og klik **Run**
3. Verificér med: `SELECT sort_order, question FROM statements ORDER BY sort_order;`

Seed-filen er idempotent — den kan køres flere gange uden at slette brugerdata. Eksisterende afgjorte udsagn overskrives ikke.

Kræver migration `20260521140000_statements_sort_order_unique.sql` — køres via `supabase db push`.

| # | Spørgsmål | Type |
|---|-----------|------|
| 1 | Bliver der scoret over 100 mål i hele turneringen? | over_under |
| 2 | Bliver der scoret over 40 mål i gruppespillet? | over_under |
| 3 | Kommer der mindst én kamp, der ender 0-0? | yes_no |
| 4 | Kommer der mindst én kamp med 5 eller flere mål? | yes_no |
| 5 | Kommer der mindst én kamp, hvor et hold scorer 4 eller flere mål? | yes_no |
| 6 | Bliver der flere end 10 uafgjorte kampe i gruppespillet? | yes_no |
| 7 | Scorer Danmark mindst 5 mål i gruppespillet? | yes_no |
| 8 | Går Danmark videre fra gruppen? | yes_no |
| 9 | Bliver finalen afgjort efter 90 minutter? | yes_no |
| 10 | Bliver der scoret af begge hold i åbningskampen? | yes_no |
| 11 | Kommer der mindst én kamp, hvor et hold vinder med 3 eller flere mål? | yes_no |
| 12 | Hvilket hold scorer flest mål i gruppespillet? | team |
| 13 | Hvilket hold lukker færrest mål ind i gruppespillet? | team |
| 14 | Bliver der flere hjemmesejre end udesejre i gruppespillet? | yes_no |
| 15 | Bliver vinderen fra Europa? | yes_no |

Alle udsagn kan afgøres manuelt af admin på `/admin/statements` ved turneringens afslutning.

Pointlogikken for udsagn ligger i `src/lib/statement-scoring.ts` og er dækket af unit tests (`npm run test`).
