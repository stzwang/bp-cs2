"use client";

import { supabase } from "@/lib/supabase";
import type { Match } from "@/lib/types";
import { useEffect, useState } from "react";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
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
        borderRadius: size > 48 ? 8 : 4,
        background: "var(--card2)",
        border: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size > 48 ? Math.round(size * 0.28) : 9,
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

function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === "live";
  const isDone = match.status === "completed";
  const t1Won = isDone && match.winner_team === match.team1_id;
  const t2Won = isDone && match.winner_team === match.team2_id;

  return (
    <a href={`/match/${match.id}`} style={{ display: "block", marginBottom: 12 }}>
      {/* Meta line above the card — matches BP's format exactly */}
      <div
        style={{
          fontSize: 11,
          marginBottom: 4,
          display: "flex",
          alignItems: "center",
          flexWrap: "nowrap",
          whiteSpace: "nowrap",
          overflow: "hidden",
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          gap: 0,
        }}
      >
        {isLive && (
          <>
            <span style={{ color: "var(--red)", fontWeight: 700 }}>In Progress</span>
            <Sep />
          </>
        )}
        {!isLive && !isDone && (
          <>
            <span>{formatTime(match.scheduled_at)}</span>
            <Sep />
          </>
        )}
        {isDone && (
          <>
            <span>Final</span>
            <Sep />
          </>
        )}
        <span>{match.format}</span>
        <Sep />
        <span>
          {match.stage} · {match.event_name}
        </span>
      </div>

      {/* Card — gradient uses both team accent colors, matching BP */}
      <div
        style={{
          background:
            match.team1.accent_color && match.team2.accent_color
              ? `linear-gradient(to bottom right, ${match.team1.accent_color}18, transparent), linear-gradient(to top left, ${match.team2.accent_color}18, transparent), var(--card)`
              : "var(--card)",
          borderRadius: 8,
          boxShadow: "0px 0px 5px 0px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        {/* Team 1 row */}
        <TeamRow
          name={match.team1.name}
          logoUrl={match.team1.logo_url}
          score={match.series_score_1}
          won={t1Won}
          lost={isDone && !t1Won}
        />

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", opacity: 0.3, margin: "0 10px" }} />

        {/* Team 2 row */}
        <TeamRow
          name={match.team2.name}
          logoUrl={match.team2.logo_url}
          score={match.series_score_2}
          won={t2Won}
          lost={isDone && !t2Won}
        />
      </div>
    </a>
  );
}

function TeamRow({
  name,
  logoUrl,
  score,
  won,
  lost,
}: {
  name: string;
  logoUrl?: string | null;
  score: number;
  won: boolean;
  lost: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "9px 14px",
        gap: 10,
        opacity: lost ? 0.45 : 1,
      }}
    >
      <TeamLogo name={name} logoUrl={logoUrl} />
      <span
        style={{
          flex: 1,
          fontWeight: won ? 700 : 300,
          fontSize: 14,
          lineHeight: 1.3,
        }}
      >
        {name}
      </span>
      <div style={{ display: "flex", alignItems: "center" }}>
        <span
          style={{
            fontWeight: won ? 900 : 300,
            fontSize: 14,
            width: 12,
            textAlign: "center",
          }}
        >
          {score}
        </span>
        {won ? <CaretLeft /> : <div style={{ marginLeft: 4, width: 12 }} />}
      </div>
    </div>
  );
}

function CaretLeft() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ marginLeft: 4, flexShrink: 0 }}
    >
      <path d="M13.883 5.007l.058 -.005h.118l.058 .005l.06 .009l.052 .01l.108 .032l.067 .027l.132 .07l.09 .065l.081 .073l.083 .094l.054 .077l.054 .096l.017 .036l.027 .067l.032 .108l.01 .053l.01 .06l.004 .057l.002 .059v12c0 .852 -.986 1.297 -1.623 .783l-.084 -.076l-6 -6a1 1 0 0 1 -.083 -1.32l.083 -.094l6 -6l.094 -.083l.077 -.054l.096 -.054l.036 -.017l.067 -.027l.108 -.032l.053 -.01l.06 -.01z" />
    </svg>
  );
}

function Sep() {
  return (
    <span style={{ color: "var(--border)", margin: "0 6px", fontWeight: 300 }}>
      |
    </span>
  );
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "completed">("upcoming");

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

    fetch("/api/discover", { method: "POST" }).catch(() => null);
    const discoverInterval = setInterval(
      () => fetch("/api/discover", { method: "POST" }).catch(() => null),
      2 * 60 * 1000
    );

    const channel = supabase
      .channel("cs2_matches_list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cs2_matches" },
        () => fetchMatches()
      )
      .subscribe();

    return () => {
      clearInterval(discoverInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = matches.filter((m) =>
    tab === "completed" ? m.status === "completed" : m.status !== "completed"
  );

  const grouped: Record<string, Match[]> = {};
  for (const m of filtered) {
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
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Matches</h1>

      {/* Tab toggle — matches BP's Upcoming/Live | Completed pattern */}
      <div
        style={{
          display: "flex",
          background: "var(--card2)",
          borderRadius: 8,
          padding: 4,
          marginBottom: 24,
          gap: 4,
        }}
      >
        {(["upcoming", "completed"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 6,
              border: "none",
              background: tab === t ? "var(--card)" : "transparent",
              color: tab === t ? "var(--text)" : "var(--muted)",
              fontWeight: tab === t ? 700 : 400,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
              transition: "all 0.15s",
            }}
          >
            {t === "upcoming" ? "Upcoming / Live" : "Completed"}
          </button>
        ))}
      </div>

      {Object.entries(grouped).map(([day, dayMatches]) => (
        <div key={day} style={{ marginBottom: 32 }}>
          {/* Date divider */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 14,
            }}
          >
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>
              {day}
            </span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>

          {dayMatches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      ))}
    </div>
  );
}
