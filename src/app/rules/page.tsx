import Link from "next/link";
import { PageHeader } from "@/components/page-header";

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Alt du skal vide for at deltage og score point."
        eyebrow="VM 2026 Slutrundespil"
        title="Regler"
      />

      <section className="rounded-lg border border-pitch-100 bg-pitch-50 px-4 py-3">
        <p className="text-sm font-semibold text-pitch-900">
          Vil du vide, hvordan navn, email, bud og point bruges?{" "}
          <Link className="font-black text-pitch-700" href="/privacy">
            Læs om privatliv og data
          </Link>
          .
        </p>
      </section>

      {/* Kampbud */}
      <section className="card space-y-4">
        <h2 className="text-lg font-black text-slate-950">Kampbud</h2>
        <ul className="space-y-2 text-sm font-semibold text-slate-700">
          <li className="flex gap-2">
            <span className="shrink-0 text-pitch-700">→</span>
            Du afgiver bud på alle grundspilskampe inden deadline.
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-pitch-700">→</span>
            Du kan rette dine bud helt frem til deadline — kun det senest gemte tæller.
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-pitch-700">→</span>
            Når deadline er passeret, kan bud ikke ændres. Det gælder for alle kampe i grundspillet.
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-pitch-700">→</span>
            Bud på slutspilskampe åbner, hvis og når slutspilsdeadline sættes af admin.
          </li>
        </ul>
      </section>

      {/* Pointregler */}
      <section className="card space-y-4">
        <h2 className="text-lg font-black text-slate-950">Pointregler for kampbud</h2>
        <p className="text-sm font-semibold text-slate-600">
          Resultater beregnes ud fra det ordinære opgør — altså <strong>90 minutters spilletid</strong>.
          Forlænget spilletid og straffesparkskonkurrencer tæller ikke.
        </p>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2.5 text-left font-black text-slate-700">Betingelse</th>
                <th className="px-4 py-2.5 text-right font-black text-slate-700">Point</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-2.5 font-semibold text-slate-700">Korrekt hjemmeholdsmål</td>
                <td className="px-4 py-2.5 text-right font-black text-pitch-700">1</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-semibold text-slate-700">Korrekt udeholdsmål</td>
                <td className="px-4 py-2.5 text-right font-black text-pitch-700">1</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-semibold text-slate-700">
                  Korrekt udfald (hjemmesejer / uafgjort / udesejer)
                </td>
                <td className="px-4 py-2.5 text-right font-black text-pitch-700">1</td>
              </tr>
              <tr className="bg-pitch-50">
                <td className="px-4 py-2.5 font-black text-slate-950">Maks pr. kamp</td>
                <td className="px-4 py-2.5 text-right font-black text-pitch-700">3</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-1.5 rounded-lg bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
          <p className="font-black text-slate-800">Eksempler:</p>
          <p>Bud 2-1, resultat 2-1 → <strong className="text-pitch-700">3 point</strong> (begge mål + udfald)</p>
          <p>Bud 2-1, resultat 3-1 → <strong className="text-pitch-700">2 point</strong> (udemål + udfald)</p>
          <p>Bud 2-1, resultat 2-2 → <strong className="text-pitch-700">1 point</strong> (hjemmemål)</p>
          <p>Bud 2-1, resultat 1-2 → <strong className="text-pitch-700">0 point</strong></p>
        </div>
      </section>

      {/* Udsagn */}
      <section className="card space-y-4">
        <h2 className="text-lg font-black text-slate-950">Udsagn</h2>
        <ul className="space-y-2 text-sm font-semibold text-slate-700">
          <li className="flex gap-2">
            <span className="shrink-0 text-pitch-700">→</span>
            Der er 15 bonusudsagn om turneringen — fx &quot;Hvem vinder VM?&quot; og &quot;Scorer Danmark i alle gruppekampe?&quot;
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-pitch-700">→</span>
            Hvert korrekt udsagn giver <strong>3 point</strong>. Forkert svar giver 0 point.
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-pitch-700">→</span>
            Udsagn afgøres af admin, når turneringen er slut (eller der er svar).
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-pitch-700">→</span>
            Svarfristen for udsagn er den samme som deadlinen for kampbud.
          </li>
        </ul>
      </section>

      {/* Leaderboard */}
      <section className="card space-y-4">
        <h2 className="text-lg font-black text-slate-950">Leaderboard</h2>
        <ul className="space-y-2 text-sm font-semibold text-slate-700">
          <li className="flex gap-2">
            <span className="shrink-0 text-pitch-700">→</span>
            Leaderboard opdateres løbende, efterhånden som kampresultater og udsagn afgøres.
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-pitch-700">→</span>
            Ved pointlighed er tiebreaker: flest kamppoint → flest perfekte resultater → flest korrekte udfald → navn alfabetisk.
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-pitch-700">→</span>
            Du kan klikke på en spiller for at se deres bud på afsluttede kampe.
          </li>
        </ul>
      </section>

      {/* Startskærm */}
      <section className="card space-y-4">
        <h2 className="text-lg font-black text-slate-950">📱 Sæt appen på din startskærm</h2>
        <p className="text-sm font-semibold text-slate-600">
          Du kan bruge spillet som en app direkte fra din telefons startskærm — uden at åbne en browser.
          Det tager 10 sekunder.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-lg bg-slate-50 px-4 py-3">
            <p className="font-black text-slate-800">iPhone / iPad (Safari)</p>
            <ol className="space-y-1 text-sm font-semibold text-slate-600">
              <li className="flex gap-2">
                <span className="shrink-0 font-black text-pitch-700">1.</span>
                Åbn siden i Safari (ikke Chrome/Firefox)
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-black text-pitch-700">2.</span>
                Tryk på <strong>Del-knappen</strong> ☐↑ i bunden af skærmen
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-black text-pitch-700">3.</span>
                Rul ned og tryk <strong>&ldquo;Føj til hjemskærm&rdquo;</strong>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-black text-pitch-700">4.</span>
                Tryk <strong>&ldquo;Tilføj&rdquo;</strong> øverst til højre
              </li>
            </ol>
          </div>
          <div className="space-y-2 rounded-lg bg-slate-50 px-4 py-3">
            <p className="font-black text-slate-800">Android (Chrome)</p>
            <ol className="space-y-1 text-sm font-semibold text-slate-600">
              <li className="flex gap-2">
                <span className="shrink-0 font-black text-pitch-700">1.</span>
                Åbn siden i Chrome
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-black text-pitch-700">2.</span>
                Tryk på de <strong>tre prikker</strong> ⋮ øverst til højre
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-black text-pitch-700">3.</span>
                Tryk <strong>&ldquo;Føj til startskærm&rdquo;</strong>
              </li>
              <li className="flex gap-2">
                <span className="shrink-0 font-black text-pitch-700">4.</span>
                Bekræft med <strong>&ldquo;Tilføj&rdquo;</strong>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* Praktisk */}
      <section className="card space-y-4">
        <h2 className="text-lg font-black text-slate-950">Praktisk</h2>
        <ul className="space-y-2 text-sm font-semibold text-slate-700">
          <li className="flex gap-2">
            <span className="shrink-0 text-pitch-700">→</span>
            Du gemmer dine bud ved at trykke &quot;Gem X kampbud&quot; nederst på kampbud-siden. Bud gemmes samlet — husk at gemme.
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-pitch-700">→</span>
            Hvert udsagn gemmes separat, når du trykker &quot;Gem svar&quot;.
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-pitch-700">→</span>
            Admin kan rette åbenlyse fejl i resultater, men bud kan ikke rettes efter deadline.
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 text-pitch-700">→</span>
            Har du spørgsmål? Kontakt admin.
          </li>
        </ul>
        <p className="text-xs font-semibold text-slate-400">
          Det bemærkes herved, at Australien i nærværende konkurrences sammenhæng klassificeres under
          det Asiatiske Fodboldforbund (AFC), i overensstemmelse med Australiens fulde og gyldige
          medlemsskab heraf. Administrationen, herunder særligt deltageren Min, er hermed eksplicit,
          uigenkaldeligt og uden forbehold fritaget for ethvert ansvar, enhver indsigelse samt enhver
          form for retskrav, protest eller anden anfægtelse, opstået som følge af, at en deltager har
          misforstået, fejlfortolket eller på anden vis ikke har været bekendt med Australiens
          kontinentale fodboldforbundsmæssige tilhørsforhold. Min er derudover specifikt og
          særskilt afskåret fra at fremføre indvendinger af enhver art i relation til ovenstående.
        </p>
      </section>
    </div>
  );
}
