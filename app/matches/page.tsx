"use client";

import { supabase } from "@/lib/supabase";
import type { Match } from "@/lib/types";
import { useEffect, useState } from "react";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Berlin",
  });
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Berlin",
  });
}

function LiveBadge() {
  return (
    <span
      style={{
        background: "#14301a",
        color: "var(--live)",
        border: "1px solid var(--live)",
        borderRadius: 4,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1,
        animation: "pulse 2s infinite",
      }}
    >
      LIVE
    </span>
  );
}

function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === "live";
  const isDone = match.status === "completed";

  return (
    <a href={`/match/${match.id}`}>
      <div
        style={{
          background: "var(--card)",
          border: `1px solid ${isLive ? "var(--live)" : "var(--border)"}`,
          borderRadius: 8,
          padding: "14px 18px",
          marginBottom: 8,
          cursor: "pointer",
          transition: "border-color 0.15s",
          boxShadow: isLive ? "0 0 12px #22c55e22" : "none",
        }}
      >
        {/* Top row: stage + time/status */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <span style={{ color: "var(--muted)", fontSize: 12 }}>
            {match.stage} · {match.format}
          </span>
          <span style={{ fontSize: 12 }}>
            {isLive ? (
              <LiveBadge />
            ) : isDone ? (
              <span style={{ color: "var(--muted)" }}>Final</span>
            ) : (
              <span style={{ color: "var(--muted)" }}>
                {formatTime(match.scheduled_at)} CEST
              </span>
            )}
          </span>
        </div>

        {/* Teams + scores */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* Team 1 */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
              justifyContent: "flex-end",
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: 16,
                opacity: isDone && match.winner_team !== match.team1_id ? 0.5 : 1,
              }}
            >
              {match.team1.name}
            </span>
            <TeamLogo name={match.team1.name} />
          </div>

          {/* Score */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 22,
              fontWeight: 800,
              minWidth: 60,
              justifyContent: "center",
            }}
          >
            <span
              style={{
                color:
                  isDone && match.winner_team === match.team1_id
                    ? "var(--live)"
                    : "var(--text)",
              }}
            >
              {match.series_score_1}
            </span>
            <span style={{ color: "var(--border)", fontSize: 18 }}>:</span>
            <span
              style={{
                color:
                  isDone && match.winner_team === match.team2_id
                    ? "var(--live)"
                    : "var(--text)",
              }}
            >
              {match.series_score_2}
            </span>
          </div>

          {/* Team 2 */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <TeamLogo name={match.team2.name} />
            <span
              style={{
                fontWeight: 700,
                fontSize: 16,
                opacity: isDone && match.winner_team !== match.team2_id ? 0.5 : 1,
              }}
            >
              {match.team2.name}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}

function TeamLogo({ name }: { name: string }) {
  const abbr = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 6,
        background: "var(--card2)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 12,
        fontWeight: 700,
        color: "var(--muted)",
        flexShrink: 0,
      }}
    >
      {abbr}
    </div>
  );
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchMatches() {
    const { data } = await supabase
      .from("cs2_matches")
      .select(
        "*, team1:cs2_teams!cs2_matches_team1_id_fkey(*), team2:cs2_teams!cs2_matches_team2_id_fkey(*)"
      )
      .order("scheduled_at", { ascending: true });
    setMatches((data ?? []) as unknown as Match[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchMatches();

    // Auto-discover live series in background
    fetch("/api/discover", { method: "POST" }).catch(() => null);

    // Re-poll discover every 2 minutes
    const discoverInterval = setInterval(() => {
      fetch("/api/discover", { method: "POST" }).catch(() => null);
    }, 2 * 60 * 1000);

    // Realtime subscription for match status changes
    const channel = supabase
      .channel("cs2_matches_list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cs2_matches" },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      clearInterval(discoverInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Group by day
  const grouped: Record<string, Match[]> = {};
  for (const m of matches) {
    const day = formatDay(m.scheduled_at);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(m);
  }

  if (loading) {
    return (
      <div style={{ color: "var(--muted)", padding: 40, textAlign: "center" }}>
        Loading…
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Matches</h1>
      {Object.entries(grouped).map(([day, dayMatches]) => (
        <div key={day} style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ color: "var(--muted)", fontSize: 13, fontWeight: 600 }}>
              {day}
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
          {dayMatches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      ))}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
