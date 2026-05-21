/**
 * Pure functions for the admin release checklist.
 * Kept free of I/O so they are trivially testable.
 */

export type CheckStatus = "ok" | "warn" | "error";

export type ReleaseCheck = {
  label: string;
  status: CheckStatus;
  detail: string;
};

export function checkMatchCount(count: number): ReleaseCheck {
  return {
    label: "Antal kampe i databasen",
    status: count === 104 ? "ok" : count > 0 ? "warn" : "error",
    detail:
      count === 104
        ? "104 kampe — korrekt"
        : count === 0
        ? "Ingen kampe — kør seed-filen"
        : `${count} kampe (forventet præcis 104)`,
  };
}

export function checkStatementCount(count: number): ReleaseCheck {
  return {
    label: "Antal udsagn",
    status: count === 15 ? "ok" : count > 0 ? "warn" : "error",
    detail:
      count === 15
        ? "15 udsagn — korrekt"
        : count === 0
        ? "Ingen udsagn oprettet endnu"
        : `${count} udsagn (anbefalet: 15)`,
  };
}

export function checkDeadline(deadline: string | null): ReleaseCheck {
  return {
    label: "Grundspilsdeadline sat",
    status: deadline ? "ok" : "error",
    detail: deadline
      ? `Deadline er sat`
      : "Deadline mangler — bud er ikke låste",
  };
}

export function checkGameLocked(locked: boolean): ReleaseCheck {
  return {
    label: "Global låsning",
    status: locked ? "warn" : "ok",
    detail: locked
      ? "Spillet er globalt låst — fjern lås inden release"
      : "Ikke globalt låst — korrekt",
  };
}

export function checkTestResults(matchesWithResultsCount: number): ReleaseCheck {
  return {
    label: "Testresultater på kampe",
    status: matchesWithResultsCount > 0 ? "warn" : "ok",
    detail:
      matchesWithResultsCount > 0
        ? `${matchesWithResultsCount} kamp${matchesWithResultsCount === 1 ? "" : "e"} har resultater sat — nulstil inden release`
        : "Ingen testresultater — korrekt",
  };
}

export function checkFinishedBeforeTournament(
  count: number,
  tournamentStart: Date
): ReleaseCheck {
  return {
    label: "Kampe markeret 'Afsluttet' for tidligt",
    status: count > 0 ? "warn" : "ok",
    detail:
      count > 0
        ? `${count} kamp${count === 1 ? "" : "e"} markeret som afsluttet før ${tournamentStart.toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })}`
        : "Ingen kampe fejlmarkeret — korrekt",
  };
}

export function checkUserCount(count: number): ReleaseCheck {
  return {
    label: "Registrerede spillere",
    status: count > 0 ? "ok" : "warn",
    detail:
      count === 0
        ? "Ingen brugere endnu"
        : `${count} spiller${count === 1 ? "" : "e"} registreret`,
  };
}

export function checkPredictionCoverage(
  predictionCount: number,
  userCount: number,
  matchCount: number
): ReleaseCheck {
  if (userCount === 0 || matchCount === 0) {
    return {
      label: "Kampbud indsendt",
      status: "warn",
      detail: "Ingen brugere eller kampe",
    };
  }
  const maxPossible = userCount * matchCount;
  const pct = Math.round((predictionCount / maxPossible) * 100);
  return {
    label: "Kampbud indsendt",
    status: "ok",
    detail: `${predictionCount} af ${maxPossible} mulige (${pct}%)`,
  };
}
