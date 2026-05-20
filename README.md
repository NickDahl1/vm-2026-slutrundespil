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

## Gør en bruger til admin

```sql
update public.profiles
set is_admin = true
where id = 'USER_UUID_HER';
```

Du finder brugerens UUID i Supabase Auth Users eller i `public.profiles`.
