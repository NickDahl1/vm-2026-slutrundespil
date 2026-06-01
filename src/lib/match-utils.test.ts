import { describe, it, expect } from "vitest";
import { isKnockoutOpen, isMatchRelevant, relevantMatchCount } from "./match-utils";
import type { AppSettings } from "./types";

const baseSettings: AppSettings = {
  id: "1",
  group_stage_lock_at: null,
  knockout_stage_lock_at: null,
  game_locked: false,
  knockout_predictions_open: false,
  updated_at: "2026-01-01T00:00:00Z",
};

// ── isKnockoutOpen ────────────────────────────────────────────────────────────

describe("isKnockoutOpen", () => {
  it("returns false when knockout_predictions_open = false", () => {
    expect(isKnockoutOpen({ ...baseSettings, knockout_predictions_open: false })).toBe(false);
  });

  it("returns true when knockout_predictions_open = true", () => {
    expect(isKnockoutOpen({ ...baseSettings, knockout_predictions_open: true })).toBe(true);
  });

  it("returns false when settings is null", () => {
    expect(isKnockoutOpen(null)).toBe(false);
  });

  it("returns false when settings is undefined", () => {
    expect(isKnockoutOpen(undefined)).toBe(false);
  });
});

// ── isMatchRelevant ───────────────────────────────────────────────────────────

describe("isMatchRelevant", () => {
  it("group_stage match is always relevant when knockout is closed", () => {
    expect(isMatchRelevant({ phase: "group_stage" }, false)).toBe(true);
  });

  it("group_stage match is always relevant when knockout is open", () => {
    expect(isMatchRelevant({ phase: "group_stage" }, true)).toBe(true);
  });

  it("knockout_stage match is NOT relevant when knockout is closed", () => {
    expect(isMatchRelevant({ phase: "knockout_stage" }, false)).toBe(false);
  });

  it("knockout_stage match IS relevant when knockout is open", () => {
    expect(isMatchRelevant({ phase: "knockout_stage" }, true)).toBe(true);
  });
});

// ── relevantMatchCount ────────────────────────────────────────────────────────

describe("relevantMatchCount", () => {
  it("returns only group_stage count when knockout is closed", () => {
    expect(relevantMatchCount(48, 64, false)).toBe(48);
  });

  it("returns total count when knockout is open", () => {
    expect(relevantMatchCount(48, 64, true)).toBe(112);
  });

  it("handles zero knockout matches (before they are created)", () => {
    expect(relevantMatchCount(48, 0, false)).toBe(48);
    expect(relevantMatchCount(48, 0, true)).toBe(48);
  });
});

// ── Integration: eligibility does not require knockout preds before open ──────

describe("eligibility — knockout not required before open", () => {
  it("group_stage only: 48 group predictions + 0 knockout = eligible when knockout closed", () => {
    // relevantMatchCount = 48 (group only)
    // user has 48 group predictions → eligible
    const relevant = relevantMatchCount(48, 64, false);
    expect(relevant).toBe(48);
    // 48 >= 48 → true (combined with statements check separately)
    expect(48 >= relevant).toBe(true);
  });

  it("after knockout opens: 48 group + 0 knockout = NOT eligible (missing 64 knockout)", () => {
    const relevant = relevantMatchCount(48, 64, true);
    expect(relevant).toBe(112);
    // 48 < 112 → not enough
    expect(48 >= relevant).toBe(false);
  });

  it("after knockout opens: 112 total predictions = eligible", () => {
    const relevant = relevantMatchCount(48, 64, true);
    expect(112 >= relevant).toBe(true);
  });
});
