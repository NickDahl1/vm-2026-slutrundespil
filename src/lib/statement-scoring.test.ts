import { describe, it, expect } from "vitest";
import { calculateStatementScore } from "./statement-scoring";

describe("calculateStatementScore", () => {
  it("gives 3 points for a correct answer", () => {
    expect(
      calculateStatementScore({ answer: "Ja", correctAnswer: "Ja", isResolved: true })
    ).toBe(3);
  });

  it("gives 0 points for a wrong answer", () => {
    expect(
      calculateStatementScore({ answer: "Nej", correctAnswer: "Ja", isResolved: true })
    ).toBe(0);
  });

  it("is case-insensitive for text answers", () => {
    expect(
      calculateStatementScore({ answer: "ja", correctAnswer: "Ja", isResolved: true })
    ).toBe(3);
    expect(
      calculateStatementScore({ answer: "JA", correctAnswer: "ja", isResolved: true })
    ).toBe(3);
  });

  it("trims whitespace before comparing", () => {
    expect(
      calculateStatementScore({ answer: "  Ja  ", correctAnswer: "Ja", isResolved: true })
    ).toBe(3);
    expect(
      calculateStatementScore({ answer: "Ja", correctAnswer: "  Ja  ", isResolved: true })
    ).toBe(3);
  });

  it("gives 0 points when statement is not resolved", () => {
    expect(
      calculateStatementScore({ answer: "Ja", correctAnswer: "Ja", isResolved: false })
    ).toBe(0);
  });

  it("gives 3 points for matching number answers", () => {
    expect(
      calculateStatementScore({ answer: "100", correctAnswer: "100", isResolved: true })
    ).toBe(3);
  });

  it("gives 0 points for non-matching number answers", () => {
    expect(
      calculateStatementScore({ answer: "99", correctAnswer: "100", isResolved: true })
    ).toBe(0);
  });
});
