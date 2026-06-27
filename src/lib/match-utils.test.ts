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
  it("returns true when predictions_open = true", () => {
    expect(isMatchRelevant({ predictions_open: true })).toBe(true);
  });

  it("returns false when predictions_open = false", () => {
    expect(isMatchRelevant({ predictions_open: false })).toBe(false);
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
