"use client";

import type { GameState, Match, PlayerState, SeriesState, TeamGameState } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

const POLL_MS = 10_000;

function formatSeconds(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function clockLabel(game: GameState): string {
  const c = game.clock;
  if (!c) return "";
  if (!c.ticking && c.ticksBackwards) return `Freeze  ${formatSeconds(c.currentSeconds)}`;
  if (c.ticking && c.ticksBackwards) return `💣 BOMB  ${formatSeconds(c.currentSeconds)}`;
  if (c.ticking && !c.ticksBackwards) return `Live  ${formatSeconds(c.currentSeconds)}`;
  return "";
}

function winTypeLabel(wt: string | null): string {
  if (!wt) return "";
  const map: Record<string, string> = {
    bombExploded: "💣 Exploded",
    bomb_detonated: "💣 Exploded",
    bombDefused: "🔵 Defused",
    bomb_defused: "🔵 Defused",
    opponentEliminated: "☠️ Elim",
    opponent_eliminated: "☠️ Elim",
    timeExpired: "⏱️ Time",
    time_expired: "⏱️ Time",
  };
  return map[wt] ?? wt;
}

function HpBar({ hp, max = 100 }: { hp: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  const color = pct > 50 ? "#22c55e" : pct > 25 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 80 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          background: "var(--card2)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 12, minWidth: 24, textAlign: "right", color: "var(--muted)" }}>
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
    <tr
      style={{
        opacity: player.alive ? 1 : 0.4,
        borderBottom: "1px solid var(--border)",
      }}
    >
      <td style={{ padding: "6px 8px", fontWeight: 600, color: player.alive ? "var(--text)" : "var(--muted)" }}>
        {!player.alive && <span style={{ marginRight: 4 }}>💀</span>}
        {player.name}
      </td>
      <td style={{ padding: "6px 8px", minWidth: 100 }}>
        {player.alive ? <HpBar hp={player.currentHealth} /> : null}
      </td>
      <td style={{ padding: "6px 8px", color: "var(--muted)", fontSize: 12 }}>
        {player.currentArmor > 0 ? "🛡️" : ""}
      </td>
      <td style={{ padding: "6px 8px", color: "#4ade80", fontWeight: 600 }}>
        ${player.money.toLocaleString()}
      </td>
      <td style={{ padding: "6px 8px", textAlign: "center" }}>{player.kills}</td>
      <td style={{ padding: "6px 8px", textAlign: "center" }}>{player.deaths}</td>
      <td style={{ padding: "6px 8px", textAlign: "center" }}>{player.headshots}</td>
      <td style={{ padding: "6px 8px", textAlign: "center", color: "var(--muted)" }}>{adr}</td>
      <td style={{ padding: "6px 8px", color: sideColor, fontSize: 12 }}>
        {(player as { primaryWeapon?: string }).primaryWeapon ?? "—"}
      </td>
    </tr>
  );
}

function TeamTable({
  team,
  totalRounds,
}: {
  team: TeamGameState;
  totalRounds: number;
}) {
  const isT = team.side === "terrorists";
  const sideColor = isT ? "var(--t)" : "var(--ct)";
  const sideLabel = isT ? "T" : "CT";

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 8px",
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
              borderRadius: 4,
              padding: "1px 6px",
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {sideLabel}
          </span>
          <span style={{ fontWeight: 700, fontSize: 15 }}>{team.name}</span>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>
            ${team.money.toLocaleString()}
          </span>
          <span style={{ fontSize: 20, fontWeight: 800 }}>{team.score}</span>
        </div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "var(--card2)", borderBottom: "1px solid var(--border)" }}>
            {["Player", "HP", "", "$", "K", "D", "HS", "ADR", "Weapon"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "4px 8px",
                  textAlign: h === "K" || h === "D" || h === "HS" || h === "ADR" ? "center" : "left",
                  color: "var(--muted)",
                  fontSize: 11,
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
              <PlayerRow key={p.id} player={p as PlayerState & { primaryWeapon?: string }} side={team.side} totalRounds={totalRounds} />
            ))}
        </tbody>
      </table>
    </div>
  );
}

function MapTab({
  game,
  active,
  onClick,
}: {
  game: GameState;
  active: boolean;
  onClick: () => void;
}) {
  const label = game.mapName.charAt(0).toUpperCase() + game.mapName.slice(1);
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: 6,
        border: active ? "1px solid var(--live)" : "1px solid var(--border)",
        background: active ? "#14301a" : "var(--card)",
        color: active ? "var(--live)" : "var(--muted)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {label}
      {game.finished && " ✓"}
      {game.started && !game.finished && " ●"}
    </button>
  );
}

function RoundHistory({ game }: { game: GameState }) {
  const done = game.rounds.filter((r) => r.finished);
  if (!done.length) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
        Round History
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {done.map((round) => {
          const winner = round.teams.find((t) => t.won);
          const isT = winner?.side === "terrorists";
          return (
            <div
              key={round.id}
              title={`R${round.sequenceNumber}: ${winTypeLabel(winner?.winType ?? null)}`}
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                background: isT ? "#422006" : "#1e3a5f",
                border: `1px solid ${isT ? "var(--t)" : "var(--ct)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
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
      {/* Map header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: "var(--card2)",
          borderRadius: 8,
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <span style={{ fontWeight: 600 }}>
          {game.mapName.charAt(0).toUpperCase() + game.mapName.slice(1)}
        </span>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {game.started && !game.finished && (
            <span style={{ color: "var(--live)", fontWeight: 600, fontSize: 13 }}>
              Round {currentRound}
            </span>
          )}
          {clockStr && (
            <span style={{ color: "var(--muted)", fontSize: 13 }}>{clockStr}</span>
          )}
          {game.finished && (
            <span style={{ color: "var(--muted)", fontSize: 12 }}>Complete</span>
          )}
        </div>
      </div>

      {/* Player tables side by side */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {game.team1 && (
          <TeamTable team={game.team1} totalRounds={completedRounds} />
        )}
        {game.team2 && (
          <TeamTable team={game.team2} totalRounds={completedRounds} />
        )}
      </div>

      <RoundHistory game={game} />
    </div>
  );
}

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
        // Default active tab to current live game
        const liveIdx = (data.games as GameState[]).findIndex(
          (g) => g.started && !g.finished
        );
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
      {/* Series header */}
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          padding: "20px 24px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1, justifyContent: "flex-end" }}>
          <span style={{ fontWeight: 700, fontSize: 20 }}>{match.team1.name}</span>
        </div>
        <div style={{ textAlign: "center", minWidth: 80 }}>
          <div style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>
            <span
              style={{
                color:
                  series && series.team1Score > series.team2Score
                    ? "var(--live)"
                    : "var(--text)",
              }}
            >
              {series?.team1Score ?? match.series_score_1}
            </span>
            <span style={{ color: "var(--border)", margin: "0 8px" }}>:</span>
            <span
              style={{
                color:
                  series && series.team2Score > series.team1Score
                    ? "var(--live)"
                    : "var(--text)",
              }}
            >
              {series?.team2Score ?? match.series_score_2}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
            {match.format}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 20 }}>{match.team2.name}</span>
        </div>
      </div>

      {/* No grid_series_id yet */}
      {!match.grid_series_id && (
        <div
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 40,
            textAlign: "center",
            color: "var(--muted)",
          }}
        >
          <div style={{ fontSize: 16, marginBottom: 8 }}>Match hasn&apos;t started yet</div>
          <div style={{ fontSize: 12 }}>
            Scheduled {new Date(match.scheduled_at).toLocaleString("en-US", {
              weekday: "long",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
              timeZone: "Europe/Berlin",
            })} CEST
          </div>
          <div style={{ fontSize: 11, marginTop: 12, color: "var(--muted)" }}>
            Live data will appear automatically when the match starts
          </div>
        </div>
      )}

      {/* Map tabs */}
      {series && series.games.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {series.games.map((g, i) => (
            <MapTab
              key={g.id}
              game={g}
              active={i === activeGameIdx}
              onClick={() => setActiveGameIdx(i)}
            />
          ))}
        </div>
      )}

      {/* Live game view */}
      {activeGame && <GameView game={activeGame} />}

      {/* Poll status */}
      {match.grid_series_id && (
        <div
          style={{
            marginTop: 16,
            fontSize: 11,
            color: "var(--muted)",
            textAlign: "right",
          }}
        >
          {lastPoll ? `Updated ${lastPoll.toLocaleTimeString()} · refreshes in ${countdown}s` : "Connecting…"}
        </div>
      )}
    </div>
  );
}
