/**
 * Helpers for calculating aggregate statistics over a set of match predictions.
 */

export type MatchPredInput = { home: number; away: number };

export type MatchStats = {
  avgHome: string;
  avgAway: string;
  pctHome: number;
  pctDraw: number;
  pctAway: number;
  mostPopular: string;
  totalBets: number;
};

/**
 * Given an array of predicted home/away scores for a single match,
 * returns aggregate statistics. Returns null when no predictions exist.
 */
export function calcMatchStats(preds: MatchPredInput[]): MatchStats | null {
  if (preds.length === 0) return null;

  const n = preds.length;
  const avgHome = (preds.reduce((s, p) => s + p.home, 0) / n).toFixed(1);
  const avgAway = (preds.reduce((s, p) => s + p.away, 0) / n).toFixed(1);

  const homeWins = preds.filter((p) => p.home > p.away).length;
  const draws = preds.filter((p) => p.home === p.away).length;
  const awayWins = preds.filter((p) => p.home < p.away).length;

  const pctHome = Math.round((homeWins / n) * 100);
  const pctDraw = Math.round((draws / n) * 100);
  const pctAway = Math.round((awayWins / n) * 100);

  // Most popular result — pick the result with the highest frequency
  const freq = new Map<string, number>();
  for (const p of preds) {
    const key = `${p.home}-${p.away}`;
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  const mostPopular = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];

  return { avgHome, avgAway, pctHome, pctDraw, pctAway, mostPopular, totalBets: n };
}

/**
 * Determines whether a user is eligible to view the /predictions page.
 * Eligible when: they have submitted all match predictions AND all statement
 * answers, OR they are an admin.
 */
export function isPredictionsEligible(
  myMatchPreds: number,
  totalMatches: number,
  myStmtPreds: number,
  totalStmts: number,
  isAdmin: boolean
): boolean {
  if (isAdmin) return true;
  const hasAllMatch = myMatchPreds >= totalMatches && totalMatches > 0;
  const hasAllStmt = myStmtPreds >= totalStmts && totalStmts > 0;
  return hasAllMatch && hasAllStmt;
}
