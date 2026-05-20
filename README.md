# VM 2026

VM 2026 er fundamentet til en mobil-first slutrundespil-app, hvor brugere senere kan oprette sig, logge ind, afgive kampbud, svare på udsagn og følge leaderboard.

Denne første version indeholder kun app-struktur, navigation, placeholder-sider og dokumentation. Scraper/API, fuld authentication-flow, pointberegning og dataopdatering er ikke implementeret endnu.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth og Supabase database senere
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

Adgangskoder må aldrig gemmes eller vises i klartekst. Authentication skal bygges videre på Supabase Auth.
