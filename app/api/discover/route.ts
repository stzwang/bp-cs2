import { gridQuery, nameMatch, PLAYER_LOOKUP_QUERY } from "@/lib/grid";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST() {
  const admin = supabaseAdmin();

  // Find upcoming matches that have started or start within 90 minutes
  const cutoff = new Date(Date.now() + 90 * 60 * 1000).toISOString();
  const { data: matches, error: matchErr } = await admin
    .from("cs2_matches")
    .select(
      "id, team1_id, team2_id, scheduled_at, team1:cs2_teams!cs2_matches_team1_id_fkey(name), team2:cs2_teams!cs2_matches_team2_id_fkey(name)"
    )
    .in("status", ["upcoming"])
    .lte("scheduled_at", cutoff);

  if (matchErr || !matches?.length) {
    return Response.json({ updated: [], msg: matchErr?.message ?? "no upcoming matches" });
  }

  // Collect team IDs from those matches
  const teamIds = [...new Set(matches.flatMap((m) => [m.team1_id, m.team2_id]))];

  const { data: seeds } = await admin
    .from("cs2_player_seeds")
    .select("team_id, player_name, steam64_id")
    .in("team_id", teamIds);

  if (!seeds?.length) {
    return Response.json({ updated: [], msg: "no seeds for these teams yet" });
  }

  // Batch-query GRID
  const seedArgs = seeds.map((s, i) => ({ alias: `p${i}`, steam64: s.steam64_id }));
  const json = await gridQuery(PLAYER_LOOKUP_QUERY(seedArgs)).catch(() => null);
  if (!json?.data) return Response.json({ updated: [], msg: "GRID unreachable" });

  // Collect unique live series
  const liveSeries = new Map<string, { id: string; names: string[] }>();
  for (const result of Object.values(json.data)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = result as any;
    if (s?.started && !s?.finished && s?.id && !liveSeries.has(s.id)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      liveSeries.set(s.id, { id: s.id, names: (s.teams ?? []).map((t: any) => t.name as string) });
    }
  }

  if (!liveSeries.size) return Response.json({ updated: [], msg: "no live series found" });

  // Match series to our DB matches by team name
  const updated: number[] = [];
  for (const match of matches) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t1 = (match.team1 as any)?.name ?? "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t2 = (match.team2 as any)?.name ?? "";

    for (const series of liveSeries.values()) {
      const hasT1 = series.names.some((n) => nameMatch(n, t1));
      const hasT2 = series.names.some((n) => nameMatch(n, t2));
      if (hasT1 && hasT2) {
        await admin
          .from("cs2_matches")
          .update({ grid_series_id: series.id, status: "live" })
          .eq("id", match.id);
        updated.push(match.id);
        break;
      }
    }
  }

  return Response.json({ updated });
}
