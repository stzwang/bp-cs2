import { gridQuery, getPrimaryWeapon, SERIES_QUERY } from "@/lib/grid";
import { DEMO_NAVI_G2 } from "@/lib/demo-series";
import type { GameState, SeriesState } from "@/lib/types";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseGame(g: any): GameState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parseTeam = (t: any) => ({
    id: t.id ?? "",
    name: t.name ?? "",
    side: t.side ?? "",
    score: t.score ?? 0,
    money: t.money ?? 0,
    loadoutValue: t.loadoutValue ?? 0,
    kills: t.kills ?? 0,
    deaths: t.deaths ?? 0,
    headshots: t.headshots ?? 0,
    damageDealt: t.damageDealt ?? 0,
    firstKill: t.firstKill ?? false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    players: (t.players ?? []).map((p: any) => ({
      id: p.id ?? "",
      name: p.name ?? "",
      alive: p.alive ?? false,
      currentHealth: p.currentHealth ?? 0,
      currentArmor: p.currentArmor ?? 0,
      money: p.money ?? 0,
      loadoutValue: p.loadoutValue ?? 0,
      kills: p.kills ?? 0,
      deaths: p.deaths ?? 0,
      headshots: p.headshots ?? 0,
      damageDealt: p.damageDealt ?? 0,
      firstKill: p.firstKill ?? false,
      weaponKills: p.weaponKills ?? [],
      inventory: p.inventory?.items ?? [],
      position: p.position ?? null,
      primaryWeapon: getPrimaryWeapon(p.inventory?.items ?? []),
    })),
  });

  const teams = (g.teams ?? []).map(parseTeam);
  const segments = (g.segments ?? [])
    // GRID may label rounds as type "round", "phase", or omit type — accept any segment with a sequenceNumber
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((s: any) => s.sequenceNumber != null)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((s: any) => ({
      id: s.id,
      sequenceNumber: s.sequenceNumber,
      duration: s.duration ?? null,
      started: s.started ?? false,
      finished: s.finished ?? false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      teams: (s.teams ?? []).map((st: any) => ({
        id: st.id,
        name: st.name,
        side: st.side,
        won: st.won ?? false,
        kills: st.kills ?? 0,
        firstKill: st.firstKill ?? false,
        winType: st.winType ?? null,
      })),
    }));

  return {
    id: g.id,
    sequenceNumber: g.sequenceNumber,
    mapName: g.map?.name ?? "unknown",
    started: g.started ?? false,
    finished: g.finished ?? false,
    clock: g.clock
      ? {
          ticking: g.clock.ticking,
          ticksBackwards: g.clock.ticksBackwards,
          currentSeconds: g.clock.currentSeconds,
          type: g.clock.type ?? null,
        }
      : null,
    team1: teams[0] ?? null,
    team2: teams[1] ?? null,
    rounds: segments,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ seriesId: string }> }
) {
  const { seriesId } = await params;

  if (seriesId === "demo-navi-g2") {
    return Response.json({ data: DEMO_NAVI_G2 });
  }

  try {
    const json = await gridQuery(SERIES_QUERY(seriesId));
    const raw = json?.data?.seriesState;
    if (!raw) return Response.json({ data: null });

    const seriesTeams = raw.teams ?? [];
    const result: SeriesState = {
      id: raw.id,
      started: raw.started,
      finished: raw.finished,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      team1Score: (seriesTeams[0] as any)?.score ?? 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      team2Score: (seriesTeams[1] as any)?.score ?? 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      team1Name: (seriesTeams[0] as any)?.name ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      team2Name: (seriesTeams[1] as any)?.name ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      games: (raw.games ?? []).map((g: any) => parseGame(g)),
    };

    return Response.json({ data: result });
  } catch (err) {
    console.error("GRID fetch error", err);
    return Response.json({ data: null, error: String(err) }, { status: 500 });
  }
}
