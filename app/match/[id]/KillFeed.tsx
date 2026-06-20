"use client";

import type { KillEvent } from "@/lib/types";
import { useEffect, useState } from "react";
import Minimap from "./Minimap";

export default function KillFeed({
  kills,
  team1Color,
  team2Color,
}: {
  kills: KillEvent[];
  team1Color?: string;
  team2Color?: string;
}) {
  const c1 = team1Color ?? "#5b8cff";
  const c2 = team2Color ?? "#ff5b6e";

  // Newest first
  const ordered = [...kills].sort((a, b) => b.ts - a.ts);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Default selection follows the latest kill until the user picks one.
  const [pinned, setPinned] = useState(false);
  const latestId = ordered[0]?.id ?? null;
  useEffect(() => {
    if (!pinned && latestId) {
      setSelectedId(latestId);
    }
  }, [latestId, pinned]);

  const selected = ordered.find((k) => k.id === selectedId) ?? ordered[0] ?? null;

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        Kill Feed
        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>
          {kills.length} kill{kills.length === 1 ? "" : "s"} captured live
        </span>
      </div>

      {ordered.length === 0 ? (
        <div
          style={{
            background: "var(--card2)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "24px 16px",
            textAlign: "center",
            color: "var(--muted)",
            fontSize: 12,
          }}
        >
          Waiting for kills… positions are captured as kills happen while this page is open.
        </div>
      ) : (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
          {/* Feed list */}
          <div
            style={{
              flex: "1 1 260px",
              minWidth: 240,
              maxHeight: 360,
              overflowY: "auto",
              border: "1px solid var(--border)",
              borderRadius: 8,
              background: "var(--card)",
            }}
          >
            {ordered.map((k) => {
              const isSel = selected?.id === k.id;
              const killerTeam = k.positions.find((p) => p.playerId === k.killerId)?.team;
              const killerColor = killerTeam ? (killerTeam === 1 ? c1 : c2) : "var(--muted)";
              const victimTeam = k.positions.find((p) => p.playerId === k.victimId)?.team ?? 2;
              const victimColor = victimTeam === 1 ? c1 : c2;
              return (
                <button
                  type="button"
                  key={k.id}
                  onClick={() => {
                    setSelectedId(k.id);
                    setPinned(true);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "8px 12px",
                    border: "none",
                    borderLeft: `3px solid ${isSel ? "#ffd166" : "transparent"}`,
                    borderBottom: "1px solid var(--border)",
                    background: isSel ? "var(--card2)" : "transparent",
                    color: "var(--text)",
                    cursor: "pointer",
                    fontSize: 12,
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "var(--muted)",
                      minWidth: 26,
                    }}
                  >
                    R{k.round}
                  </span>
                  <span style={{ color: killerColor, fontWeight: 600 }}>
                    {k.killerName ?? "—"}
                  </span>
                  <span style={{ color: "var(--muted)" }}>▸</span>
                  <span style={{ color: victimColor, opacity: 0.85 }}>{k.victimName}</span>
                </button>
              );
            })}
          </div>

          {/* Minimap for the selected kill */}
          <div style={{ flex: "0 0 auto" }}>
            <Minimap kill={selected} team1Color={c1} team2Color={c2} />
          </div>
        </div>
      )}
    </div>
  );
}
