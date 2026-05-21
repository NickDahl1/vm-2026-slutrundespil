import { describe, it, expect } from "vitest";
import {
  formatDanishDate,
  formatDanishTime,
  formatDanishDateTime,
  getDanishDateKey
} from "./date-format";

// Opening match: 2026-06-11 19:00 UTC = 21:00 CEST
const OPENING = "2026-06-11T19:00:00Z";
// Late night match: 2026-06-14T23:00:00Z = 01:00 CEST on Jun 15
const LATE = "2026-06-14T23:00:00Z";

describe("formatDanishTime", () => {
  it("converts UTC to Copenhagen CEST (+2)", () => {
    expect(formatDanishTime(OPENING)).toBe("21.00");
  });

  it("wraps past midnight correctly", () => {
    expect(formatDanishTime(LATE)).toBe("01.00");
  });
});

describe("formatDanishDate", () => {
  it("returns full Danish date for opening match", () => {
    const result = formatDanishDate(OPENING);
    expect(result).toContain("2026");
    expect(result.toLowerCase()).toContain("juni");
    expect(result.toLowerCase()).toContain("torsdag");
  });

  it("returns the Copenhagen date (not UTC date) for late night match", () => {
    const result = formatDanishDate(LATE);
    // UTC date is Jun 14, Copenhagen date is Jun 15
    expect(result).toContain("15");
    expect(result.toLowerCase()).toContain("juni");
  });
});

describe("getDanishDateKey", () => {
  it("returns ISO date in Copenhagen timezone", () => {
    expect(getDanishDateKey(OPENING)).toBe("2026-06-11");
  });

  it("returns next day's date when UTC midnight cross happens", () => {
    // 23:00 UTC = 01:00 CEST next day
    expect(getDanishDateKey(LATE)).toBe("2026-06-15");
  });
});

describe("formatDanishDateTime", () => {
  it("includes both date and time", () => {
    const result = formatDanishDateTime(OPENING);
    expect(result).toContain("2026");
    expect(result).toContain("21.00");
  });
});
