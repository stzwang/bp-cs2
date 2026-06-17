import type { SeriesState, GameState, RoundState, TeamGameState, PlayerState } from "./types";

function p(id: string, name: string, kills: number, deaths: number, headshots: number, damageDealt: number): PlayerState {
  return { id, name, alive: false, currentHealth: 0, currentArmor: 0, money: 0, loadoutValue: 0, kills, deaths, headshots, damageDealt, firstKill: false, weaponKills: [], inventory: [], position: null };
}

function makeRounds(
  t1Id: string, t1Name: string,
  t2Id: string, t2Name: string,
  wins: ("t1" | "t2")[],
  t1StartSide: "terrorists" | "counterTerrorists"
): RoundState[] {
  return wins.map((winner, i) => {
    const n = i + 1;
    const isOT = n > 24;
    const halves = isOT ? Math.floor((n - 25) / 6) + 2 : Math.floor((n - 1) / 12);
    const t1Side = halves % 2 === 0 ? t1StartSide : (t1StartSide === "terrorists" ? "counterTerrorists" : "terrorists");
    const t2Side = t1Side === "terrorists" ? "counterTerrorists" : "terrorists";
    const t1Won = winner === "t1";
    const winnerSide = t1Won ? t1Side : t2Side;
    const wt = winnerSide === "terrorists" ? "bombExploded" : "opponentEliminated";
    return {
      id: `r${n}`, sequenceNumber: n, duration: 85 + (n % 30), started: true, finished: true,
      teams: [
        { id: t1Id, name: t1Name, side: t1Side, won: t1Won, kills: t1Won ? 4 : 1, firstKill: t1Won, winType: t1Won ? wt : null },
        { id: t2Id, name: t2Name, side: t2Side, won: !t1Won, kills: !t1Won ? 4 : 1, firstKill: !t1Won, winType: !t1Won ? wt : null },
      ],
    };
  });
}

function team(id: string, name: string, side: string, score: number, players: PlayerState[]): TeamGameState {
  return {
    id, name, side, score,
    money: 0, loadoutValue: 0, firstKill: false,
    kills: players.reduce((s, p) => s + p.kills, 0),
    deaths: players.reduce((s, p) => s + p.deaths, 0),
    headshots: players.reduce((s, p) => s + p.headshots, 0),
    damageDealt: players.reduce((s, p) => s + p.damageDealt, 0),
    players,
  };
}

// Map 1: Mirage — NaVi wins 13-8 (NaVi CT first, 21 rounds)
const M1_WINS: ("t1" | "t2")[] = [
  "t1","t1","t2","t1","t1","t2","t1","t1","t1","t2","t1","t1",
  "t2","t1","t2","t1","t2","t2","t1","t2","t1",
];
const naviMap1 = [
  p("s1mple","s1mple",24,17,10,1890), p("b1t","b1t",21,15,8,1680),
  p("electronic","electronic",18,16,6,1470), p("Aleksib","Aleksib",16,19,5,1176),
  p("iM","iM",15,17,5,1092),
];
const g2Map1 = [
  p("NiKo","NiKo",22,18,9,1680), p("huNter","huNter-",18,17,7,1428),
  p("jks","jks",17,22,6,1260), p("malbsMd","malbsMd",15,19,4,1092),
  p("nexa","nexa",12,18,4,987),
];

// Map 2: Nuke — G2 wins 13-9 (NaVi T first, 22 rounds)
const M2_WINS: ("t1" | "t2")[] = [
  "t2","t1","t2","t2","t1","t2","t1","t2","t2","t1","t2","t1",
  "t2","t1","t2","t2","t1","t2","t1","t2","t1","t2",
];
const naviMap2 = [
  p("s1mple","s1mple",23,19,10,1760), p("b1t","b1t",18,19,7,1452),
  p("electronic","electronic",17,20,6,1320), p("Aleksib","Aleksib",14,22,4,1100),
  p("iM","iM",11,23,3,880),
];
const g2Map2 = [
  p("NiKo","NiKo",26,14,11,1980), p("huNter","huNter-",22,16,8,1760),
  p("jks","jks",20,17,7,1540), p("malbsMd","malbsMd",16,18,5,1210),
  p("nexa","nexa",19,18,5,1100),
];

// Map 3: Inferno — G2 wins 16-14 OT (NaVi CT first, 30 rounds)
const M3_WINS: ("t1" | "t2")[] = [
  "t1","t2","t1","t2","t1","t1","t2","t1","t2","t1","t2","t2",
  "t2","t1","t2","t1","t2","t1","t1","t2","t1","t2","t2","t1",
  "t1","t2","t2","t2","t1","t2",
];
const naviMap3 = [
  p("s1mple","s1mple",30,26,12,2400), p("b1t","b1t",26,24,10,2080),
  p("electronic","electronic",23,26,8,1840), p("Aleksib","Aleksib",18,28,6,1440),
  p("iM","iM",16,29,5,1280),
];
const g2Map3 = [
  p("NiKo","NiKo",32,22,13,2560), p("huNter","huNter-",28,20,11,2240),
  p("jks","jks",27,24,10,2160), p("malbsMd","malbsMd",25,26,8,2000),
  p("nexa","nexa",21,21,7,1680),
];

const game1: GameState = {
  id: "demo-g1", sequenceNumber: 1, mapName: "mirage", started: true, finished: true, clock: null,
  team1: team("navi","Natus Vincere","terrorists",13,naviMap1),
  team2: team("g2","G2 Esports","counterTerrorists",8,g2Map1),
  rounds: makeRounds("navi","Natus Vincere","g2","G2 Esports",M1_WINS,"counterTerrorists"),
};

const game2: GameState = {
  id: "demo-g2", sequenceNumber: 2, mapName: "nuke", started: true, finished: true, clock: null,
  team1: team("navi","Natus Vincere","counterTerrorists",9,naviMap2),
  team2: team("g2","G2 Esports","terrorists",13,g2Map2),
  rounds: makeRounds("navi","Natus Vincere","g2","G2 Esports",M2_WINS,"terrorists"),
};

const game3: GameState = {
  id: "demo-g3", sequenceNumber: 3, mapName: "inferno", started: true, finished: true, clock: null,
  team1: team("navi","Natus Vincere","terrorists",14,naviMap3),
  team2: team("g2","G2 Esports","counterTerrorists",16,g2Map3),
  rounds: makeRounds("navi","Natus Vincere","g2","G2 Esports",M3_WINS,"counterTerrorists"),
};

export const DEMO_NAVI_G2: SeriesState = {
  id: "demo-navi-g2",
  started: true,
  finished: true,
  team1Score: 1,
  team2Score: 2,
  team1Name: "Natus Vincere",
  team2Name: "G2 Esports",
  games: [game1, game2, game3],
};
