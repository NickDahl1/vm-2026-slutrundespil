export type Match = {
  id: number;
  phase: "group_stage" | "knockout_stage";
  match_no: number;
  group_name: string | null;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  home_score_90: number | null;
  away_score_90: number | null;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  external_match_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Prediction = {
  id: number;
  user_id: string;
  match_id: number;
  predicted_home_score: number;
  predicted_away_score: number;
  points_home_score: number;
  points_away_score: number;
  points_outcome: number;
  total_points: number;
  submitted_at: string;
  updated_at: string;
};

export type AppSettings = {
  id: string;
  group_stage_lock_at: string | null;
  knockout_stage_lock_at: string | null;
  game_locked: boolean;
  updated_at: string;
};

export type Statement = {
  id: number;
  sort_order: number;
  question: string;
  answer_type:
    | "yes_no"
    | "over_under"
    | "number"
    | "player"
    | "team"
    | "text"
    | "multiple_choice";
  options: string[] | null;
  correct_answer: string | null;
  points: number;
  is_resolved: boolean;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StatementPrediction = {
  id: number;
  user_id: string;
  statement_id: number;
  answer: string;
  points: number;
  submitted_at: string;
  updated_at: string;
};

export type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  match_points: number;
  statement_points: number;
  total_points: number;
  perfect_results: number;
  correct_outcomes: number;
  predictions_count: number;
  statement_answers_count: number;
  rank: number;
};

export type PredWithMatch = {
  id: number;
  predicted_home_score: number;
  predicted_away_score: number;
  points_home_score: number;
  points_away_score: number;
  points_outcome: number;
  total_points: number;
  matches: Pick<
    Match,
    | "id"
    | "match_no"
    | "phase"
    | "group_name"
    | "home_team"
    | "away_team"
    | "home_score_90"
    | "away_score_90"
    | "status"
    | "kickoff_at"
  > | null;
};

export const STATUS_LABELS: Record<Match["status"], string> = {
  scheduled: "Planlagt",
  live: "Spilles nu",
  finished: "Afsluttet",
  postponed: "Udsat",
  cancelled: "Aflyst",
};

export const PHASE_LABELS: Record<Match["phase"], string> = {
  group_stage: "Gruppespil",
  knockout_stage: "Slutspil",
};
