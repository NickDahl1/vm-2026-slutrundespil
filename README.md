# VM 2026

VM 2026 er fundamentet til en mobil-first slutrundespil-app, hvor brugere senere kan oprette sig, logge ind, afgive kampbud, svare på udsagn og følge leaderboard.

Denne version indeholder app-struktur, navigation, placeholder-sider, Supabase Auth og et første Supabase schema. Scraper/API, kampbud, fuld pointberegning og automatisk dataopdatering er ikke implementeret endnu.

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

```bash
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

Opret en `.env.local` baseret på `.env.example`, når Supabase-projektet er klar:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Disse variabler skal også ligge i Vercel. Appen bruger kun Supabase public URL og anon key i Next.js-klienten/server-rendering. Adgangskoder gemmes aldrig i appens database og håndteres kun af Supabase Auth.

## Supabase schema

Kør migrationen i Supabase SQL Editor eller via Supabase CLI:

```bash
supabase db push
```

Migrationen ligger her:

```bash
supabase/migrations/20260520120000_auth_schema.sql
```

Den opretter:

- `profiles`
- `app_settings`
- `admin_messages`
- `prizes`

`profiles` refererer til `auth.users(id)` og indeholder kun appens profilfelter. Email og adgangskoder ligger ikke i appens egne tabeller.

## Gør en bruger til admin

Når brugeren har oprettet sig, kan en eksisterende admin eller Supabase SQL Editor sætte admin-rollen:

```sql
update public.profiles
set is_admin = true
where id = 'USER_UUID_HER';
```

Du finder brugerens UUID i Supabase Auth Users eller i `public.profiles`.
