# Release review - VM 2026 slutrundespil

Dato: 22. maj 2026

## Samlet vurdering

**Næsten klar.**

Appen er funktionelt tæt på launch, men denne PR indeholder en vigtig sikkerhedsstramning, der skal køres som Supabase-migration før deltagere inviteres. Efter migrationen og en kort manuel test på rigtig Supabase-projekt vurderes appen klar til de første deltagere.

## Kritiske fejl fundet

1. **Direkte databaseadgang kunne se for mange bud for tidligt**
   - UI'et på `/predictions` låste korrekt, men RLS havde en policy, der lod alle authenticated users læse alle `match_predictions` og `statement_predictions`.
   - Risiko: en teknisk bruger kunne læse andres ikke-frigivne bud via Supabase API.
   - Status: **Rettet** i `20260522110000_release_review_security_policies.sql`.

2. **Direkte databaseadgang kunne ændre egne bud efter deadline**
   - Server actions stoppede ændringer efter deadline, men RLS tillod insert/update af egne kampbud og udsagnssvar uden deadline-check.
   - Risiko: en teknisk bruger kunne omgå UI og server action.
   - Status: **Rettet** i `20260522110000_release_review_security_policies.sql`.

3. **Auth callback accepterede ekstern `next` URL**
   - `/auth/callback?next=...` kunne i princippet bruges til open redirect.
   - Status: **Rettet** ved kun at acceptere relative paths.

4. **Leaderboard-detaljeside kunne fejle for andre spillere**
   - Siden slog display name op i `profiles`, hvor RLS kun gav almindelige brugere adgang til egen profil.
   - Status: **Rettet** ved at bruge `leaderboard_view` som allerede er den offentlige leaderboard-kilde.

## Mindre fejl fundet

- Admin settings action brugte RLS og admin-layout, men ikke `requireAdmin` direkte som de øvrige admin actions.
- Statistik brugte direkte tællinger fra `profiles`, `match_predictions` og `statement_predictions`, som ville blive påvirket af strammere RLS.
- En ubrugt `PlaceholderPanel`-komponent indeholdt synlig "Placeholder"-tekst.
- Admin release-siden brugte ordet "Mock-data" i UI. Det er nu skrevet som "Testdata".

## Ting rettet i denne PR

- Tilføjet RLS-hardening:
  - Kun admin eller brugere, der har afgivet alle kampbud og alle udsagnssvar, kan læse alle ikke-afsluttede bud/svar.
  - Egne kampbud kan kun oprettes/ændres når kampen er planlagt, spillet ikke er globalt låst, og relevant deadline ikke er passeret.
  - Egne udsagnssvar kan kun oprettes/ændres når spillet ikke er globalt låst, udsagnet ikke er afgjort, og grundspilsdeadline ikke er passeret.
  - Eligible brugere kan læse deltagerprofiler uden email, så `/predictions` kan vise display names.
- Lukket open redirect i auth callback.
- Gjort `/leaderboard/[user_id]` robust for almindelige brugere.
- Gjort statistik-tællinger baseret på `leaderboard_view`, så de ikke afhænger af bred prediction-RLS.
- Tilføjet direkte `requireAdmin` i admin settings action.
- Fjernet ubrugt placeholder-komponent.
- Omdøbt "Mock-data" til "Testdata" i admin release UI.

## Ting der kan vente

- Emailnotifikationer fra Kontakt admin gemmes i databasen, men email-provider er ikke implementeret endnu. Det er ikke release-blokerende, hvis admin tjekker `/admin/messages`.
- Auto-sync adapteren til football-data.org er bevidst ikke implementeret endnu. Workflowet stopper sikkert uden API-key og skriver ikke testdata automatisk.
- Admin kan ikke se emailadresser i `/admin/users`; email ligger i Supabase Auth. Det matcher den sikre løsning uden service role key i frontend, men admin skal bruge Supabase Dashboard ved behov.
- Mere fuldautomatisk end-to-end test med rigtig Supabase testprojekt kan tilføjes senere.

## Manuel testliste før launch

### Brugerflow

- Landing: gæst ser login/opret og kan gå til privatliv.
- Signup: opret testbruger, bekræft email-flow og kontrollér redirect til dashboard.
- Login/logout/reset password: test med korrekt og forkert adgangskode.
- Dashboard: vis korrekte manglende kampbud og udsagn.
- Kampe mobil: udfyld flere bud, gem samlet, reload og se at bud er gemt.
- Udsagn mobil: udfyld flere svar, gem samlet, reload og se at svar er gemt.
- Leaderboard: almindelig bruger kan se leaderboard og åbne en anden spillers afsluttede kampe.
- Alles bud:
  - bruger uden alle bud ser locked state med antal manglende kampbud/udsagn og links.
  - bruger med alle bud ser fanerne Kampbud/Udsagn og tabeller med display names.
- Statistik: tjek empty states før første kamp og graf-empty-state uden snapshots.
- Regler og privacy: tjek tekst og mobil-layout.
- Kontakt admin: send besked og se success state.

### Adminflow

- Almindelig bruger kan ikke åbne `/admin`.
- Admin dashboard viser korrekte tællinger.
- Users: rediger display name/is_admin på testbruger; slet testbruger med bekræftelse; bekræft at admin ikke kan slette sig selv.
- Matches: opret/rediger/slet testkamp; sæt resultat og se point genberegnet.
- Statements: opret/rediger/slet testudsagn; afgør udsagn og se point.
- Settings: sæt/fjern deadlines i dansk tid; slå global lås til/fra.
- Release checklist: tjek at advarsler giver mening for admin.
- Export: download CSV for leaderboard, kampbud, udsagnssvar, kampe, udsagn og brugere.
- Messages: markér kontaktbesked som læst og arkivér.

### Sikkerhed og data

- Kør Supabase-migrationen i denne PR.
- Som almindelig bruger før alle bud: forsøg direkte Supabase select på `match_predictions` og `statement_predictions`; ikke-afsluttede andres bud må ikke returneres.
- Som almindelig bruger efter deadline: forsøg direkte Supabase insert/update på egne bud og udsagnssvar; det skal afvises af RLS.
- Kontrollér at emailadresser ikke vises på leaderboard, Alles bud, statistik eller deltagerrettede sider.
- Kontrollér at `SUPABASE_SERVICE_ROLE_KEY` kun findes i scripts/GitHub Actions og ikke i frontend.

## Migrationer

Kør denne migration i Supabase før launch:

- `supabase/migrations/20260522110000_release_review_security_policies.sql`

Hvis privacy-PR'en ikke allerede er merged, skal denne release-review branch behandles som stacked oven på `codex/privacy-data-copy`.
