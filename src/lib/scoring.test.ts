import { describe, it, expect } from "vitest";
import { calculateScore } from "./scoring";

describe("calculateScore", () => {
  it("bud 2-1, resultat 2-1 = 3 point", () => {
    expect(
      calculateScore({ predictedHome: 2, predictedAway: 1, actualHome: 2, actualAway: 1 })
    ).toEqual({ points_home_score: 1, points_away_score: 1, points_outcome: 1, total_points: 3 });
  });

  it("bud 2-1, resultat 3-1 = 2 point", () => {
    expect(
      calculateScore({ predictedHome: 2, predictedAway: 1, actualHome: 3, actualAway: 1 })
    ).toEqual({ points_home_score: 0, points_away_score: 1, points_outcome: 1, total_points: 2 });
  });

  it("bud 2-1, resultat 2-2 = 1 point", () => {
    expect(
      calculateScore({ predictedHome: 2, predictedAway: 1, actualHome: 2, actualAway: 2 })
    ).toEqual({ points_home_score: 1, points_away_score: 0, points_outcome: 0, total_points: 1 });
  });

  it("bud 2-1, resultat 0-1 = 1 point", () => {
    expect(
      calculateScore({ predictedHome: 2, predictedAway: 1, actualHome: 0, actualAway: 1 })
    ).toEqual({ points_home_score: 0, points_away_score: 1, points_outcome: 0, total_points: 1 });
  });

  it("bud 2-1, resultat 1-2 = 0 point", () => {
    expect(
      calculateScore({ predictedHome: 2, predictedAway: 1, actualHome: 1, actualAway: 2 })
    ).toEqual({ points_home_score: 0, points_away_score: 0, points_outcome: 0, total_points: 0 });
  });

  it("bud 0-0, resultat 0-0 = 3 point", () => {
    expect(
      calculateScore({ predictedHome: 0, predictedAway: 0, actualHome: 0, actualAway: 0 })
    ).toEqual({ points_home_score: 1, points_away_score: 1, points_outcome: 1, total_points: 3 });
  });

  it("bud 1-1, resultat 2-2 = 1 point", () => {
    expect(
      calculateScore({ predictedHome: 1, predictedAway: 1, actualHome: 2, actualAway: 2 })
    ).toEqual({ points_home_score: 0, points_away_score: 0, points_outcome: 1, total_points: 1 });
  });
});
