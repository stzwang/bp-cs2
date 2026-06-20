export interface Team {
  id: number;
  name: string;
  short_name: string;
  logo_url: string | null;
  grid_team_id: number | null;
  accent_color: string | null;
}

export interface Match {
  id: number;
  team1_id: number;
  team2_id: number;
  scheduled_at: string;
  format: string;
  stage: string;
  event_name: string;
  status: "upcoming" | "live" | "completed";
  grid_series_id: string | null;
  series_score_1: number;
  series_score_2: number;
  winner_team: number | null;
  team1: Team;
  team2: Team;
}

export interface PlayerState {
  id: string;
  name: string;
  alive: boolean;
  currentHealth: number;
  currentArmor: number;
  money: number;
  loadoutValue: number;
  kills: number;
  deaths: number;
  headshots: number;
  damageDealt: number;
  firstKill: boolean;
  weaponKills: { weaponName: string; count: number }[];
  inventory: { name: string; quantity: number; equipped: number; stashed: number }[];
  position: { x: number; y: number } | null;
}

export interface TeamGameState {
  id: string;
  name: string;
  side: string;
  score: number;
  money: number;
  loadoutValue: number;
  kills: number;
  deaths: number;
  headshots: number;
  damageDealt: number;
  firstKill: boolean;
  players: PlayerState[];
}

export interface RoundState {
  id: string;
  sequenceNumber: number;
  duration: number | null;
  started: boolean;
  finished: boolean;
  teams: {
    id: string;
    name: string;
    side: string;
    won: boolean;
    kills: number;
    firstKill: boolean;
    winType: string | null;
  }[];
}

export interface GameState {
  id: string;
  sequenceNumber: number;
  mapName: string;
  started: boolean;
  finished: boolean;
  clock: {
    ticking: boolean;
    ticksBackwards: boolean;
    currentSeconds: number;
    type: string | null;
  } | null;
  team1: TeamGameState | null;
  team2: TeamGameState | null;
  rounds: RoundState[];
}

/** One player's position + status captured at the instant a kill is detected. */
export interface PositionSnapshot {
  playerId: string;
  name: string;
  side: string;
  team: 1 | 2;
  x: number;
  y: number;
  alive: boolean;
}

/**
 * A kill reconstructed by diffing live state polls. Killer attribution is best-effort
 * (the enemy whose kill count rose in the same interval), and positions are sampled at
 * detection time — close to, but not exactly, the kill tick.
 */
export interface KillEvent {
  id: string;
  gameId: string;
  mapName: string;
  round: number;
  ts: number;
  victimId: string;
  victimName: string;
  victimSide: string;
  killerId: string | null;
  killerName: string | null;
  killerSide: string | null;
  positions: PositionSnapshot[];
}

export interface SeriesState {
  id: string;
  started: boolean;
  finished: boolean;
  team1Score: number;
  team2Score: number;
  team1Name: string;
  team2Name: string;
  games: GameState[];
}
