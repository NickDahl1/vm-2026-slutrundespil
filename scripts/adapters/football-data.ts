/**
 * FootballDataOrgAdapter — fetches VM 2026 results from football-data.org.
 *
 * ─── STATUS ──────────────────────────────────────────────────────────────────
 * TODO: Implement when the tournament starts (June 2026).
 *
 * VM 2026 match results will not exist until the first game is played.
 * Once matches are played, implement the body of fetchResults() below.
 *
 * ─── HOW TO IMPLEMENT ────────────────────────────────────────────────────────
 *
 * 1. Sign up for a free API key at https://www.football-data.org/
 *    Free tier: 10 req/min, covers FIFA World Cup. No credit card required.
 *
 * 2. Add your key as a GitHub Secret named FOOTBALL_API_KEY (see README.md).
 *
 * 3. Pre-map external IDs (do this once, before the tournament):
 *    GET https://api.football-data.org/v4/competitions/WC/matches?season=2026
 *    Headers: { "X-Auth-Token": "<your-key>" }
 *
 *    For each match in the response, note:
 *      - match.id           → the stable external ID
 *      - match.matchday     → use to correlate with match_no in your DB
 *      - match.homeTeam.name / match.awayTeam.name
 *
 *    Update matches.external_match_id via SQL:
 *      UPDATE matches SET external_match_id = '<id>' WHERE match_no = <n>;
 *
 *    Or create a one-off migration/seed script that patches the column.
 *
 * 4. Implement fetchResults() to hit:
 *    GET /v4/competitions/WC/matches?season=2026&status=FINISHED
 *
 *    Response shape (simplified):
 *    {
 *      "matches": [
 *        {
 *          "id": 123456,
 *          "status": "FINISHED",
 *          "score": {
 *            "fullTime": { "home": 2, "away": 1 },
 *            "halfTime": { "home": 1, "away": 0 }
 *          }
 *        },
 *        ...
 *      ]
 *    }
 *
 *    IMPORTANT: Use score.fullTime (= 90-minute result), never score.regularTime
 *    or score.extraTime. The game scoring system awards points based on 90 min only.
 *
 * 5. Map each match to ExternalMatchResult and return the array.
 *
 * ─── RATE LIMITS ─────────────────────────────────────────────────────────────
 * Free tier: 10 requests per minute. The daily sync fetches all finished
 * matches in a single request, so rate limits are not a concern.
 *
 * ─── ALTERNATIVE: api-football.com ──────────────────────────────────────────
 * If football-data.org proves unreliable for WC 2026, try api-football.com
 * via RapidAPI. Endpoint: GET /fixtures?league=1&season=2026&status=FT
 * The response shape differs; adapt accordingly.
 */

import type { MatchResultAdapter, ExternalMatchResult } from "./types.js";

const BASE_URL = "https://api.football-data.org/v4";
const WC_COMPETITION = "WC";
const WC_SEASON = "2026";

export class FootballDataOrgAdapter implements MatchResultAdapter {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) throw new Error("FootballDataOrgAdapter: apiKey is required");
    this.apiKey = apiKey;
  }

  async fetchResults(): Promise<ExternalMatchResult[]> {
    // TODO: Remove this error and implement the body below when WC 2026 starts.
    throw new Error(
      "FootballDataOrgAdapter is not yet implemented. " +
        "See the TODO comments in scripts/adapters/football-data.ts for instructions. " +
        "Set USE_MOCK=true to use the mock adapter instead."
    );

    /* ── IMPLEMENTATION TEMPLATE (uncomment and adapt) ──────────────────────

    const url =
      `${BASE_URL}/competitions/${WC_COMPETITION}/matches` +
      `?season=${WC_SEASON}&status=FINISHED`;

    const res = await fetch(url, {
      headers: { "X-Auth-Token": this.apiKey },
    });

    if (!res.ok) {
      throw new Error(
        `football-data.org responded with HTTP ${res.status}: ${await res.text()}`
      );
    }

    const json = (await res.json()) as {
      matches: Array<{
        id: number;
        status: string;
        score: {
          fullTime: { home: number | null; away: number | null };
        };
      }>;
    };

    return json.matches
      .filter(
        (m) =>
          m.status === "FINISHED" &&
          m.score.fullTime.home !== null &&
          m.score.fullTime.away !== null
      )
      .map((m) => ({
        externalId: String(m.id),
        homeScore90: m.score.fullTime.home!,
        awayScore90: m.score.fullTime.away!,
        isFinished: true,
      }));

    ── END TEMPLATE ─────────────────────────────────────────────────────── */
  }
}

// Keep the symbol referenced so TypeScript doesn't tree-shake the constants.
void BASE_URL;
void WC_COMPETITION;
void WC_SEASON;
