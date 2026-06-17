"use client";

import type { GameState, Match, PlayerState, SeriesState, TeamGameState } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

const POLL_MS = 10_000;

// ─── Shared helpers ──────────────────────────────────────────────────────────

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function clockLabel(game: GameState): string {
  const c = game.clock;
  if (!c) return "";
  if (!c.ticking && c.ticksBackwards) return `Freeze  ${formatSeconds(c.currentSeconds)}`;
  if (c.ticking && c.ticksBackwards) return `Bomb  ${formatSeconds(c.currentSeconds)}`;
  if (c.ticking && !c.ticksBackwards) return formatSeconds(c.currentSeconds);
  return "";
}

function winTypeLabel(wt: string | null): string {
  if (!wt) return "";
  const map: Record<string, string> = {
    bombExploded: "Exploded", bomb_detonated: "Exploded",
    bombDefused: "Defused", bomb_defused: "Defused",
    opponentEliminated: "Elim", opponent_eliminated: "Elim",
    timeExpired: "Time", time_expired: "Time",
  };
  return map[wt] ?? wt;
}

function TeamLogo({
  name,
  logoUrl,
  size = 24,
}: {
  name: string;
  logoUrl?: string | null;
  size?: number;
}) {
  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={name}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          borderRadius: size > 48 ? 8 : 3,
          flexShrink: 0,
        }}
      />
    );
  }
  const abbr = name
    .replace(/^Team /i, "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size > 48 ? 10 : 4,
        background: "var(--card2)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size > 48 ? Math.round(size * 0.26) : 9,
        fontWeight: 700,
        color: "var(--muted)",
        flexShrink: 0,
        letterSpacing: "0.02em",
      }}
    >
      {abbr}
    </div>
  );
}

// ─── Match header (BP-style) ──────────────────────────────────────────────────

function MatchHeader({
  match,
  series,
  activeGameIdx,
  onGameSelect,
}: {
  match: Match;
  series: SeriesState | null;
  activeGameIdx: number;
  onGameSelect: (i: number) => void;
}) {
  const isLive = match.status === "live";
  const isDone = match.status === "completed";
  const score1 = series?.team1Score ?? match.series_score_1;
  const score2 = series?.team2Score ?? match.series_score_2;
  const c1 = match.team1.accent_color ?? "#7b38ab";
  const c2 = match.team2.accent_color ?? "#3b6fd4";

  return (
    <div
      style={{
        background: `linear-gradient(to bottom right, ${c1}22, transparent 50%), linear-gradient(to top left, ${c2}22, transparent 50%), var(--card)`,
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "16px 20px",
        marginBottom: 20,
      }}
    >
      {/* Top bar: back | event | badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <a
          href="/matches"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "var(--card2)",
            color: "var(--muted)",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          ← Matches
        </a>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 500 }}>
            {match.stage} · {match.event_name}
          </span>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            {new Date(match.scheduled_at).toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </span>
        </div>

        {/* Live / Upcoming badge */}
        {isLive ? (
          <span
            style={{
              background: "#f33636",
              color: "#fff",
              borderRadius: 4,
              padding: "3px 10px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.05em",
              animation: "pulse 2s infinite",
            }}
          >
            LIVE
          </span>
        ) : isDone ? (
          <span
            style={{
              background: "var(--card2)",
              color: "var(--muted)",
              border: "1px solid var(--border)",
              borderRadius: 4,
              padding: "3px 10px",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            FINAL
          </span>
        ) : (
          <span
            style={{
              background: "#3cf33620",
              color: "#3cf336",
              border: "1px solid #3cf33640",
              borderRadius: 4,
              padding: "3px 10px",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            UPCOMING
          </span>
        )}
      </div>

      {/* Team vs Team */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          flexWrap: "wrap",
          marginBottom: series && series.games.length > 0 ? 20 : 0,
        }}
      >
        {/* Team 1 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, minWidth: 120 }}>
          <TeamLogo name={match.team1.name} logoUrl={match.team1.logo_url} size={96} />
          <span style={{ color: "#7b38ab", fontWeight: 700, fontSize: 16, textAlign: "center" }}>
            {match.team1.name}
          </span>
        </div>

        {/* Score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 36,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            <span style={{ color: score1 > score2 ? "var(--text)" : "var(--muted)", fontWeight: score1 > score2 ? 900 : 300 }}>
              {score1}
            </span>
            <span style={{ color: "var(--border)", fontSize: 28 }}>-</span>
            <span style={{ color: score2 > score1 ? "var(--text)" : "var(--muted)", fontWeight: score2 > score1 ? 900 : 300 }}>
              {score2}
            </span>
          </div>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>{match.format}</span>
        </div>

        {/* Team 2 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, minWidth: 120 }}>
          <TeamLogo name={match.team2.name} logoUrl={match.team2.logo_url} size={96} />
          <span style={{ color: "#7b38ab", fontWeight: 700, fontSize: 16, textAlign: "center" }}>
            {match.team2.name}
          </span>
        </div>
      </div>

      {/* Map cards row */}
      {series && series.games.length > 0 && (
        <div style={{ overflowX: "auto", paddingBottom: 4 }}>
          <div style={{ display: "flex", gap: 8, width: "max-content" }}>
            {series.games.map((game, i) => (
              <MapCard
                key={game.id}
                game={game}
                team1Name={match.team1.name}
                team2Name={match.team2.name}
                active={i === activeGameIdx}
                onClick={() => onGameSelect(i)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MapCard({
  game,
  team1Name,
  team2Name,
  active,
  onClick,
}: {
  game: GameState;
  team1Name: string;
  team2Name: string;
  active: boolean;
  onClick: () => void;
}) {
  const mapLabel = game.mapName.charAt(0).toUpperCase() + game.mapName.slice(1);
  const t1Score = game.team1?.score ?? 0;
  const t2Score = game.team2?.score ?? 0;
  const t1Won = game.finished && t1Score > t2Score;
  const t2Won = game.finished && t2Score > t1Score;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 120,
        borderRadius: 6,
        border: `1px solid ${active ? "#7b38ab" : "var(--border)"}`,
        background: active ? "#3b1f5e" : "var(--card2)",
        padding: "10px 12px",
        cursor: "pointer",
        textAlign: "left",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: active ? "#c084fc" : "var(--muted)",
          marginBottom: 6,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{mapLabel}</span>
        {game.started && !game.finished && (
          <span style={{ color: "#f33636", fontSize: 9 }}>●</span>
        )}
        {game.finished && (
          <span style={{ color: "var(--live)", fontSize: 9 }}>✓</span>
        )}
      </div>
      {game.started && (
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: "var(--muted)", maxWidth: 64, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
              {team1Name}
            </span>
            <span style={{ fontSize: 13, fontWeight: t1Won ? 700 : 400, color: t1Won ? "var(--text)" : "var(--muted)" }}>
              {t1Score}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: "var(--muted)", maxWidth: 64, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
              {team2Name}
            </span>
            <span style={{ fontSize: 13, fontWeight: t2Won ? 700 : 400, color: t2Won ? "var(--text)" : "var(--muted)" }}>
              {t2Score}
            </span>
          </div>
        </div>
      )}
      {!game.started && (
        <span style={{ fontSize: 10, color: "var(--muted)" }}>TBD</span>
      )}
    </button>
  );
}

// ─── Live stats components ────────────────────────────────────────────────────

function HpBar({ hp, max = 100 }: { hp: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  const color = pct > 50 ? "#22c55e" : pct > 25 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 72 }}>
      <div style={{ flex: 1, height: 5, background: "var(--card2)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, minWidth: 22, textAlign: "right", color: "var(--muted)" }}>
        {hp}
      </span>
    </div>
  );
}

function PlayerRow({
  player,
  side,
  totalRounds,
}: {
  player: PlayerState & { primaryWeapon?: string };
  side: string;
  totalRounds: number;
}) {
  const adr = totalRounds > 0 ? Math.round(player.damageDealt / totalRounds) : 0;
  const sideColor = side === "terrorists" ? "var(--t)" : "var(--ct)";

  return (
    <tr style={{ opacity: player.alive ? 1 : 0.38, borderBottom: "1px solid var(--border)" }}>
      <td style={{ padding: "5px 8px", fontWeight: 600, fontSize: 13 }}>
        {!player.alive && <span style={{ marginRight: 4, fontSize: 11 }}>💀</span>}
        {player.name}
      </td>
      <td style={{ padding: "5px 8px", minWidth: 90 }}>
        {player.alive ? <HpBar hp={player.currentHealth} /> : null}
      </td>
      <td style={{ padding: "5px 8px", color: "var(--muted)", fontSize: 12 }}>
        {player.currentArmor > 0 ? "🛡" : ""}
      </td>
      <td style={{ padding: "5px 8px", color: "#4ade80", fontWeight: 600, fontSize: 12 }}>
        ${player.money.toLocaleString()}
      </td>
      <td style={{ padding: "5px 8px", textAlign: "center" }}>{player.kills}</td>
      <td style={{ padding: "5px 8px", textAlign: "center" }}>{player.deaths}</td>
      <td style={{ padding: "5px 8px", textAlign: "center" }}>{player.headshots}</td>
      <td style={{ padding: "5px 8px", textAlign: "center", color: "var(--muted)" }}>{adr}</td>
      <td style={{ padding: "5px 8px", color: sideColor, fontSize: 12 }}>
        {player.primaryWeapon ?? "—"}
      </td>
    </tr>
  );
}

function TeamTable({ team, totalRounds }: { team: TeamGameState; totalRounds: number }) {
  const isT = team.side === "terrorists";
  const sideColor = isT ? "var(--t)" : "var(--ct)";
  const sideLabel = isT ? "T" : "CT";

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Team header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 10px",
          background: "var(--card2)",
          borderRadius: "6px 6px 0 0",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              background: sideColor,
              color: "#000",
              borderRadius: 3,
              padding: "1px 6px",
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            {sideLabel}
          </span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{team.name}</span>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>${team.money.toLocaleString()}</span>
          <span style={{ fontSize: 20, fontWeight: 800 }}>{team.score}</span>
        </div>
      </div>

      {/* Player table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--card2)", borderBottom: "1px solid var(--border)" }}>
            {["Player", "HP", "", "$", "K", "D", "HS", "ADR", "Weapon"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "3px 8px",
                  textAlign: ["K", "D", "HS", "ADR"].includes(h) ? "center" : "left",
                  color: "var(--muted)",
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...team.players]
            .sort((a, b) => b.kills - a.kills)
            .map((p) => (
              <PlayerRow
                key={p.id}
                player={p as PlayerState & { primaryWeapon?: string }}
                side={team.side}
                totalRounds={totalRounds}
              />
            ))}
        </tbody>
      </table>
    </div>
  );
}

function RoundHistory({ game }: { game: GameState }) {
  const done = game.rounds.filter((r) => r.finished);
  if (!done.length) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ color: "var(--muted)", fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        Round History
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {done.map((round) => {
          const winner = round.teams.find((t) => t.won);
          const isT = winner?.side === "terrorists";
          return (
            <div
              key={round.id}
              title={`R${round.sequenceNumber}: ${winTypeLabel(winner?.winType ?? null)}`}
              style={{
                width: 26,
                height: 26,
                borderRadius: 4,
                background: isT ? "#422006" : "#1e3a5f",
                border: `1px solid ${isT ? "var(--t)" : "var(--ct)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 700,
                color: isT ? "var(--t)" : "var(--ct)",
                cursor: "default",
              }}
            >
              {round.sequenceNumber}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GameView({ game }: { game: GameState }) {
  const completedRounds = game.rounds.filter((r) => r.finished).length;
  const liveSegment = game.rounds.find((r) => r.started && !r.finished);
  const currentRound = liveSegment?.sequenceNumber ?? completedRounds + 1;
  const clockStr = clockLabel(game);

  return (
    <div>
      {/* Map info bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "var(--card2)",
          borderRadius: 8,
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14 }}>
          {game.mapName.charAt(0).toUpperCase() + game.mapName.slice(1)}
        </span>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {game.started && !game.finished && (
            <span style={{ color: "#f33636", fontWeight: 700, fontSize: 13 }}>
              Round {currentRound}
            </span>
          )}
          {clockStr && (
            <span style={{ color: "var(--muted)", fontSize: 13, fontFamily: "monospace" }}>
              {clockStr}
            </span>
          )}
          {game.finished && (
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Final</span>
          )}
        </div>
      </div>

      {/* Player tables side by side */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {game.team1 && <TeamTable team={game.team1} totalRounds={completedRounds} />}
        {game.team2 && <TeamTable team={game.team2} totalRounds={completedRounds} />}
      </div>

      <RoundHistory game={game} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LiveMatchView({ match }: { match: Match }) {
  const [series, setSeries] = useState<SeriesState | null>(null);
  const [activeGameIdx, setActiveGameIdx] = useState(0);
  const [lastPoll, setLastPoll] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(POLL_MS / 1000);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function poll() {
    if (!match.grid_series_id) return;
    try {
      const res = await fetch(`/api/grid/${match.grid_series_id}`);
      const { data } = await res.json();
      if (data) {
        setSeries(data as SeriesState);
        const liveIdx = (data.games as GameState[]).findIndex((g) => g.started && !g.finished);
        if (liveIdx >= 0) setActiveGameIdx(liveIdx);
        else setActiveGameIdx(Math.max(0, data.games.length - 1));
      }
    } catch {
      // silent
    }
    setLastPoll(new Date());
    setCountdown(POLL_MS / 1000);
  }

  useEffect(() => {
    if (!match.grid_series_id) return;
    poll();
    intervalRef.current = setInterval(poll, POLL_MS);
    const tick = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match.grid_series_id]);

  const activeGame = series?.games[activeGameIdx] ?? null;

  return (
    <div>
      {/* BP-style match header */}
      <MatchHeader
        match={match}
        series={series}
        activeGameIdx={activeGameIdx}
        onGameSelect={setActiveGameIdx}
      />

      {/* Pre-match: scheduled but not yet live */}
      {!match.grid_series_id && match.status === "upcoming" && (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "40px 24px",
            textAlign: "center",
            color: "var(--muted)",
          }}
        >
          <div style={{ fontSize: 15, marginBottom: 6 }}>Match hasn&apos;t started yet</div>
          <div style={{ fontSize: 12 }}>
            Scheduled{" "}
            {new Date(match.scheduled_at).toLocaleString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </div>
          <div style={{ fontSize: 11, marginTop: 10 }}>
            Live data appears automatically when the match starts
          </div>
        </div>
      )}

      {/* Live game stats */}
      {activeGame && <GameView game={activeGame} />}

      {/* Poll status footer */}
      {match.grid_series_id && (
        <div style={{ marginTop: 14, fontSize: 10, color: "var(--muted)", textAlign: "right" }}>
          {lastPoll
            ? `Updated ${lastPoll.toLocaleTimeString()} · refreshing in ${countdown}s`
            : "Connecting…"}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.65; }
        }
      `}</style>
    </div>
  );
}
