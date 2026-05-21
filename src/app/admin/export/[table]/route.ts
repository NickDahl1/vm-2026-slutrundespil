import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toCsvWithBom, type CsvValue } from "@/lib/csv";

const ALLOWED_TABLES = [
  "leaderboard",
  "predictions",
  "statement-predictions",
  "matches",
  "statements",
  "profiles",
] as const;

type Table = (typeof ALLOWED_TABLES)[number];

function isAllowedTable(t: string): t is Table {
  return ALLOWED_TABLES.includes(t as Table);
}

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  return (data as { is_admin: boolean } | null)?.is_admin === true;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  const supabase = await createClient();

  if (!(await isAdmin(supabase))) {
    return new NextResponse("Adgang nægtet", { status: 403 });
  }

  const { table } = await params;

  if (!isAllowedTable(table)) {
    return new NextResponse(`Ukendt tabel: ${table}`, { status: 400 });
  }

  let bytes: Uint8Array;
  const now = new Date().toISOString().slice(0, 10);
  const filename = `vm2026-${table}-${now}.csv`;

  try {
    bytes = await buildCsv(supabase, table);
  } catch (e) {
    console.error(`Export error for ${table}:`, e);
    return new NextResponse("Eksport fejlede. Prøv igen.", { status: 500 });
  }

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

type DbClient = { from: (t: string) => ReturnType<typeof Object.create> };

async function buildCsv(supabase: DbClient, table: Table): Promise<Uint8Array> {
  switch (table) {
    case "leaderboard": {
      const { data } = await supabase
        .from("leaderboard_view")
        .select("rank,display_name,total_points,match_points,statement_points,perfect_results,correct_outcomes,predictions_count,statement_answers_count")
        .order("rank", { ascending: true });

      const rows = (data ?? []) as Record<string, unknown>[];
      return toCsvWithBom(
        ["Placering", "Navn", "Total point", "Kamppoint", "Udsagnspoint", "Perfekte resultater", "Korrekte udfald", "Kampbud afgivet", "Udsagnssvar afgivet"],
        rows.map((r) => [r.rank, r.display_name, r.total_points, r.match_points, r.statement_points, r.perfect_results, r.correct_outcomes, r.predictions_count, r.statement_answers_count]) as CsvValue[][]
      );
    }

    case "predictions": {
      const { data } = await supabase
        .from("match_predictions")
        .select("id,user_id,match_id,predicted_home_score,predicted_away_score,points_home_score,points_away_score,points_outcome,total_points,submitted_at,updated_at")
        .order("match_id", { ascending: true });

      const rows = (data ?? []) as Record<string, unknown>[];
      return toCsvWithBom(
        ["id", "user_id", "match_id", "predicted_home_score", "predicted_away_score", "points_home_score", "points_away_score", "points_outcome", "total_points", "submitted_at", "updated_at"],
        rows.map((r) => [r.id, r.user_id, r.match_id, r.predicted_home_score, r.predicted_away_score, r.points_home_score, r.points_away_score, r.points_outcome, r.total_points, r.submitted_at, r.updated_at]) as CsvValue[][]
      );
    }

    case "statement-predictions": {
      const { data } = await supabase
        .from("statement_predictions")
        .select("id,user_id,statement_id,answer,points,submitted_at,updated_at")
        .order("statement_id", { ascending: true });

      const rows = (data ?? []) as Record<string, unknown>[];
      return toCsvWithBom(
        ["id", "user_id", "statement_id", "answer", "points", "submitted_at", "updated_at"],
        rows.map((r) => [r.id, r.user_id, r.statement_id, r.answer, r.points, r.submitted_at, r.updated_at]) as CsvValue[][]
      );
    }

    case "matches": {
      const { data } = await supabase
        .from("matches")
        .select("id,match_no,phase,group_name,home_team,away_team,kickoff_at,home_score_90,away_score_90,status,external_match_id,manually_corrected")
        .order("match_no", { ascending: true });

      const rows = (data ?? []) as Record<string, unknown>[];
      return toCsvWithBom(
        ["id", "match_no", "phase", "group_name", "home_team", "away_team", "kickoff_at", "home_score_90", "away_score_90", "status", "external_match_id", "manually_corrected"],
        rows.map((r) => [r.id, r.match_no, r.phase, r.group_name, r.home_team, r.away_team, r.kickoff_at, r.home_score_90, r.away_score_90, r.status, r.external_match_id, r.manually_corrected]) as CsvValue[][]
      );
    }

    case "statements": {
      const { data } = await supabase
        .from("statements")
        .select("id,sort_order,question,answer_type,correct_answer,points,is_resolved,resolved_at")
        .order("sort_order", { ascending: true });

      const rows = (data ?? []) as Record<string, unknown>[];
      return toCsvWithBom(
        ["id", "sort_order", "question", "answer_type", "correct_answer", "points", "is_resolved", "resolved_at"],
        rows.map((r) => [r.id, r.sort_order, r.question, r.answer_type, r.correct_answer, r.points, r.is_resolved, r.resolved_at]) as CsvValue[][]
      );
    }

    case "profiles": {
      const { data } = await supabase
        .from("profiles")
        .select("id,display_name,is_admin,created_at")
        .order("created_at", { ascending: true });

      const rows = (data ?? []) as Record<string, unknown>[];
      return toCsvWithBom(
        ["id", "display_name", "is_admin", "created_at"],
        rows.map((r) => [r.id, r.display_name, r.is_admin, r.created_at]) as CsvValue[][]
      );
    }
  }
}
