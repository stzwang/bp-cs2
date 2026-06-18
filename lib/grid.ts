const LIVE_URL = "https://api-op.grid.gg/live-data-feed/series-state/graphql";
const CENTRAL_URL = "https://api-op.grid.gg/central-data/graphql";

async function gridFetch(url: string, query: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.GRID_API_KEY!,
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GRID API ${res.status}`);
  return res.json();
}

export const gridQuery = (query: string) => gridFetch(LIVE_URL, query);
export const centralDataQuery = (query: string) => gridFetch(CENTRAL_URL, query);

export const SERIES_QUERY = (id: string) => `{
  seriesState(id: "${id}") {
    id started finished
    teams { ... on SeriesTeamStateCs2 { id name score } }
    games {
      id sequenceNumber started finished
      map { name }
      clock { ticking ticksBackwards currentSeconds type }
      teams { ... on GameTeamStateCs2 {
        id name side score money loadoutValue
        kills deaths headshots damageDealt firstKill
        players { ... on GamePlayerStateCs2 {
          id name alive currentHealth currentArmor maxHealth
          money loadoutValue
          kills deaths headshots damageDealt firstKill
          weaponKills { weaponName count }
          inventory { items { name quantity equipped stashed } }
          position { x y }
        }}
      }}
      segments {
        id type sequenceNumber started finished duration
        teams { ... on SegmentTeamStateCs2 {
          id name side won kills firstKill winType
        }}
      }
    }
  }
}`;

// Central Data API: fetch all scheduled series for a tournament (by sub-tournament ID)
export const ALL_SERIES_QUERY = (tournamentId: string) => `{
  allSeries(
    filter: { tournamentId: "${tournamentId}" }
    orderBy: StartTimeScheduled
    orderDirection: ASC
    first: 50
  ) {
    edges {
      node {
        id
        startTimeScheduled
        teams { baseInfo { name } }
      }
    }
  }
}`;

export const PLAYER_LOOKUP_QUERY = (seeds: { alias: string; steam64: string }[]) =>
  `{ ${seeds.map((s) => `${s.alias}: latestSeriesStateByPlayerId(id: "${s.steam64}") { id started finished teams { ... on SeriesTeamStateCs2 { id name } } }`).join("\n")} }`;

export function nameMatch(a: string, b: string): boolean {
  const n = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const na = n(a);
  const nb = n(b);
  return na.includes(nb) || nb.includes(na);
}

export function getPrimaryWeapon(
  items: { name: string; quantity: number; equipped: number }[]
): string {
  const RIFLES = [
    "ak47","m4a1","m4a1_silencer","awp","sg556","aug","famas","galil",
    "scar20","g3sg1","negev","m249",
  ];
  const SMGS = ["mac10","mp5sd","mp7","mp9","p90","bizon","ump45"];
  const SHOTGUNS = ["nova","xm1014","sawedoff","mag7"];
  const PISTOLS = [
    "deagle","glock","usp_silencer","p250","tec9","fiveseven",
    "cz75a","dualberettas","p2000","revolver",
  ];
  const NAMES: Record<string, string> = {
    ak47: "AK-47", m4a1: "M4A4", m4a1_silencer: "M4A1-S", awp: "AWP",
    deagle: "Desert Eagle", glock: "Glock", usp_silencer: "USP-S",
    sg556: "SG 553", aug: "AUG", famas: "FAMAS", galil: "Galil AR",
    p90: "P90", mp9: "MP9", mac10: "MAC-10", ump45: "UMP-45",
    mp5sd: "MP5-SD", mp7: "MP7", bizon: "PP-Bizon",
    scar20: "SCAR-20", g3sg1: "G3SG1", negev: "Negev", m249: "M249",
    nova: "Nova", xm1014: "XM1014", sawedoff: "Sawed-Off", mag7: "MAG-7",
    tec9: "Tec-9", fiveseven: "Five-SeveN", cz75a: "CZ75-Auto",
    p250: "P250", dualberettas: "Dual Berettas", p2000: "P2000",
    revolver: "R8 Revolver", knife: "Knife",
  };
  const priority = [...RIFLES, ...SMGS, ...SHOTGUNS, ...PISTOLS];
  for (const cat of priority) {
    const item = items.find((i) => i.name === cat && (i.equipped > 0 || i.quantity > 0));
    if (item) return NAMES[item.name] ?? item.name;
  }
  return "Knife";
}
