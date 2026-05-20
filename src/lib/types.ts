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
