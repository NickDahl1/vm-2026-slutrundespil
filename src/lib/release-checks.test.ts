import { describe, it, expect } from "vitest";
import {
  checkMatchCount,
  checkStatementCount,
  checkDeadline,
  checkGameLocked,
  checkKnockoutState,
  checkTestResults,
  checkFinishedBeforeTournament,
  checkUserCount,
  checkPredictionCoverage,
} from "./release-checks";

describe("checkMatchCount", () => {
  it("returns ok for exactly 104", () => {
    expect(checkMatchCount(104).status).toBe("ok");
  });

  it("returns warn for partial count", () => {
    expect(checkMatchCount(50).status).toBe("warn");
  });

  it("returns error for 0", () => {
    expect(checkMatchCount(0).status).toBe("error");
  });

  it("includes the count in detail when wrong", () => {
    expect(checkMatchCount(50).detail).toContain("50");
  });
});

describe("checkStatementCount", () => {
  it("returns ok for exactly 15", () => {
    expect(checkStatementCount(15).status).toBe("ok");
  });

  it("returns warn for partial count", () => {
    expect(checkStatementCount(8).status).toBe("warn");
  });

  it("returns error for 0", () => {
    expect(checkStatementCount(0).status).toBe("error");
  });
});

describe("checkDeadline", () => {
  it("returns ok when deadline is set", () => {
    expect(checkDeadline("2026-06-11T14:00:00Z").status).toBe("ok");
  });

  it("returns error when deadline is null", () => {
    expect(checkDeadline(null).status).toBe("error");
  });

  it("returns error when deadline is empty string", () => {
    expect(checkDeadline("").status).toBe("error");
  });
});

describe("checkGameLocked", () => {
  it("returns ok when not locked", () => {
    expect(checkGameLocked(false).status).toBe("ok");
  });

  it("returns warn when locked", () => {
    expect(checkGameLocked(true).status).toBe("warn");
  });
});

describe("checkTestResults", () => {
  it("returns ok when no matches have results", () => {
    expect(checkTestResults(0).status).toBe("ok");
  });

  it("returns warn when matches have test results", () => {
    expect(checkTestResults(3).status).toBe("warn");
  });

  it("includes count in detail", () => {
    expect(checkTestResults(3).detail).toContain("3");
  });

  it("uses singular for exactly 1", () => {
    const check = checkTestResults(1);
    expect(check.detail).toContain("1 kamp h");
    expect(check.detail).not.toContain("kampe");
  });
});

describe("checkFinishedBeforeTournament", () => {
  const start = new Date("2026-06-11");

  it("returns ok when no finished matches", () => {
    expect(checkFinishedBeforeTournament(0, start).status).toBe("ok");
  });

  it("returns warn when finished matches exist", () => {
    expect(checkFinishedBeforeTournament(2, start).status).toBe("warn");
  });
});

describe("checkUserCount", () => {
  it("returns ok when users exist", () => {
    expect(checkUserCount(5).status).toBe("ok");
  });

  it("returns warn when no users", () => {
    expect(checkUserCount(0).status).toBe("warn");
  });
});

describe("checkKnockoutState", () => {
  it("returns ok when closed before tournament", () => {
    expect(checkKnockoutState(false, true).status).toBe("ok");
  });

  it("returns warn when opened before tournament", () => {
    expect(checkKnockoutState(true, true).status).toBe("warn");
  });

  it("returns ok when opened after tournament has started", () => {
    expect(checkKnockoutState(true, false).status).toBe("ok");
  });

  it("returns ok when closed after tournament has started", () => {
    expect(checkKnockoutState(false, false).status).toBe("ok");
  });

  it("includes warning detail when opened before tournament", () => {
    expect(checkKnockoutState(true, true).detail).toContain("gruppespillet");
  });
});

describe("checkPredictionCoverage", () => {
  it("calculates percentage correctly", () => {
    const check = checkPredictionCoverage(52, 1, 104);
    expect(check.detail).toContain("52");
    expect(check.detail).toContain("50%");
  });

  it("handles zero users gracefully", () => {
    expect(checkPredictionCoverage(0, 0, 104).status).toBe("warn");
  });
});
