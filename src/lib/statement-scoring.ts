export type StatementScoreInput = {
  answer: string;
  correctAnswer: string;
  isResolved: boolean;
};

export function calculateStatementScore(input: StatementScoreInput): number {
  if (!input.isResolved) return 0;
  const norm = (s: string) => s.trim().toLowerCase();
  return norm(input.answer) === norm(input.correctAnswer) ? 3 : 0;
}
