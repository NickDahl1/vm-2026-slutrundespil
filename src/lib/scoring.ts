export type ScoreInput = {
  predictedHome: number;
  predictedAway: number;
  actualHome: number;
  actualAway: number;
};

export type ScoreResult = {
  points_home_score: number;
  points_away_score: number;
  points_outcome: number;
  total_points: number;
};

export function calculateScore(input: ScoreInput): ScoreResult {
  const points_home_score = input.predictedHome === input.actualHome ? 1 : 0;
  const points_away_score = input.predictedAway === input.actualAway ? 1 : 0;

  // Outcome: +1 = hjemmehold vinder, 0 = uafgjort, -1 = udehold vinder
  const predictedSign = Math.sign(input.predictedHome - input.predictedAway);
  const actualSign = Math.sign(input.actualHome - input.actualAway);
  const points_outcome = predictedSign === actualSign ? 1 : 0;

  return {
    points_home_score,
    points_away_score,
    points_outcome,
    total_points: points_home_score + points_away_score + points_outcome
  };
}
