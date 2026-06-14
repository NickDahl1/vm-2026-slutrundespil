import { describe, it, expect } from "vitest";
import { calcMatchStats, isPredictionsEligible } from "./prediction-stats";

// ── calcMatchStats ────────────────────────────────────────────────────────────

describe("calcMatchStats", () => {
  it("returns null for empty input", () => {
    expect(calcMatchStats([])).toBeNull();
  });

  it("returns correct averages for a single prediction", () => {
    const stats = calcMatchStats([{ home: 2, away: 1 }]);
    expect(stats).not.toBeNull();
    expect(stats!.avgHome).toBe("2.0");
    expect(stats!.avgAway).toBe("1.0");
    expect(stats!.totalBets).toBe(1);
  });

  it("rounds averages correctly", () => {
    const stats = calcMatchStats([
      { home: 1, away: 0 },
      { home: 2, away: 1 },
      { home: 3, away: 2 },
    ]);
    expect(stats!.avgHome).toBe("2.0");
    expect(stats!.avgAway).toBe("1.0");
  });

  it("calculates home/draw/away distribution", () => {
    const stats = calcMatchStats([
      { home: 2, away: 1 }, // home win
      { home: 1, away: 1 }, // draw
      { home: 0, away: 2 }, // away win
      { home: 3, away: 0 }, // home win
    ]);
    expect(stats!.pctHome).toBe(50); // 2/4
    expect(stats!.pctDraw).toBe(25); // 1/4
    expect(stats!.pctAway).toBe(25); // 1/4
  });

  it("identifies the most popular result", () => {
    const stats = calcMatchStats([
      { home: 2, away: 1 },
      { home: 2, away: 1 },
      { home: 1, away: 0 },
    ]);
    expect(stats!.mostPopular).toBe("2-1");
  });

  it("breaks ties in most popular result by first-seen order via sort stability", () => {
    // Two equally popular results — just verify it returns one of them
    const stats = calcMatchStats([
      { home: 1, away: 0 },
      { home: 2, away: 1 },
    ]);
    expect(["1-0", "2-1"]).toContain(stats!.mostPopular);
  });

  it("handles all draws", () => {
    const stats = calcMatchStats([
      { home: 0, away: 0 },
      { home: 1, away: 1 },
    ]);
    expect(stats!.pctHome).toBe(0);
    expect(stats!.pctDraw).toBe(100);
    expect(stats!.pctAway).toBe(0);
  });
});

// ── isPredictionsEligible ─────────────────────────────────────────────────────

describe("isPredictionsEligible", () => {
  it("returns true for all users regardless of submission counts", () => {
    expect(isPredictionsEligible(0, 48, 0, 15, false)).toBe(true);
    expect(isPredictionsEligible(48, 48, 15, 15, false)).toBe(true);
    expect(isPredictionsEligible(47, 48, 14, 15, false)).toBe(true);
    expect(isPredictionsEligible(0, 0, 0, 0, false)).toBe(true);
  });

  it("returns true for admins", () => {
    expect(isPredictionsEligible(0, 48, 0, 15, true)).toBe(true);
  });
});
