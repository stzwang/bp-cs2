import { centralDataQuery, gridQuery, nameMatch, ALL_SERIES_QUERY, SERIES_QUERY } from "@/lib/grid";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Sub-tournament ID for the playoff bracket (QFs, SFs, Grand Final)
// Found via: allSeries central-data → series.tournament.id
const TOURNAMENT_ID = "829583"; // IEM Cologne 2026 (Playoffs)

export async function POST() {
  const admin = supabaseAdmin();

  // --- Phase 1: Link any unmatched DB entries to their GRID series ID ---
  // Uses GRID Central Data API — no player seeds required, works before matches start
  const { data: unlinked } = await admin
    .from("cs2_matches")
    .select(
      "id, team1:cs2_teams!cs2_matches_team1_id_fkey(name), team2:cs2_teams!cs2_matches_team2_id_fkey(name)"
    )
    .is("grid_series_id", null)
    .neq("status", "completed");

  const linked: number[] = [];

  if (unlinked?.length) {
    const centralJson = await centralDataQuery(ALL_SERIES_QUERY(TOURNAMENT_ID)).catch(() => null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gridSeries: any[] = centralJson?.data?.allSeries?.edges?.map((e: any) => e.node) ?? [];

    for (const gSeries of gridSeries) {
      const gridT1: string = gSeries.teams[0]?.baseInfo?.name ?? "";
      const gridT2: string = gSeries.teams[1]?.baseInfo?.name ?? "";

      for (const dbMatch of unlinked) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbT1: string = (dbMatch.team1 as any)?.name ?? "";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dbT2: string = (dbMatch.team2 as any)?.name ?? "";

        // Accept either team order since GRID may not match our seeding order
        const matched =
          (nameMatch(gridT1, dbT1) && nameMatch(gridT2, dbT2)) ||
          (nameMatch(gridT1, dbT2) && nameMatch(gridT2, dbT1));

        if (matched) {
          await admin.from("cs2_matches").update({ grid_series_id: gSeries.id }).eq("id", dbMatch.id);
          linked.push(dbMatch.id);
          break;
        }
      }
    }
  }

  // --- Phase 2: Sync live state for all linked, non-completed matches ---
  // Detects match start (upcoming → live) and match end (live → completed)
  const { data: toSync } = await admin
    .from("cs2_matches")
    .select("id, team1_id, team2_id, grid_series_id, status")
    .not("grid_series_id", "is", null)
    .neq("status", "completed")
    .not("grid_series_id", "like", "demo-%");

  const synced: number[] = [];

  for (const match of toSync ?? []) {
    try {
      const json = await gridQuery(SERIES_QUERY(match.grid_series_id!));
      const raw = json?.data?.seriesState;
      if (!raw) continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const teams: any[] = raw.teams ?? [];
      const score1: number = teams[0]?.score ?? 0;
      const score2: number = teams[1]?.score ?? 0;

      if (raw.finished) {
        const winnerId = score1 > score2 ? match.team1_id : match.team2_id;
        await admin
          .from("cs2_matches")
          .update({
            status: "completed",
            series_score_1: score1,
            series_score_2: score2,
            winner_team: winnerId,
          })
          .eq("id", match.id);
      } else if (raw.started) {
        await admin
          .from("cs2_matches")
          .update({ status: "live", series_score_1: score1, series_score_2: score2 })
          .eq("id", match.id);
      }
      synced.push(match.id);
    } catch {
      // ignore per-match errors
    }
  }

  return Response.json({ linked, synced });
}
