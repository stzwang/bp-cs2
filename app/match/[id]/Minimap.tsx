"use client";

import { hasCalibration, normalizeMapName, radarUrl, worldToNormalized } from "@/lib/maps";
import type { KillEvent } from "@/lib/types";
import { useState } from "react";

const SIZE = 340;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export default function Minimap({
  kill,
  team1Color,
  team2Color,
}: {
  kill: KillEvent | null;
  team1Color?: string;
  team2Color?: string;
}) {
  const [radarFailed, setRadarFailed] = useState(false);

  const c1 = team1Color ?? "#5b8cff";
  const c2 = team2Color ?? "#ff5b6e";

  if (!kill) {
    return (
      <div
        style={{
          width: SIZE,
          height: SIZE,
          borderRadius: 10,
          background: "var(--card2)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted)",
          fontSize: 12,
        }}
      >
        Select a kill to view positions
      </div>
    );
  }

  const calibrated = hasCalibration(kill.mapName);
  const showRadar = calibrated && !radarFailed;

  // Relative-bounds fallback for uncalibrated maps: normalize against the snapshot's own
  // bounding box (with padding) so dots still plot in correct relative positions.
  const xs = kill.positions.map((p) => p.x);
  const ys = kill.positions.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const span = Math.max(spanX, spanY) * 1.15; // square + 15% padding

  function relative(x: number, y: number): { nx: number; ny: number } {
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    return {
      nx: 0.5 + (x - cx) / span,
      ny: 0.5 - (y - cy) / span, // flip y to screen space
    };
  }

  // Project each player into pixel space.
  const dots = kill.positions.map((p) => {
    const n = calibrated ? worldToNormalized(kill.mapName, p.x, p.y) : relative(p.x, p.y);
    const coord = n ?? relative(p.x, p.y);
    return {
      ...p,
      px: clamp01(coord.nx) * SIZE,
      py: clamp01(coord.ny) * SIZE,
      offmap: coord.nx < 0 || coord.nx > 1 || coord.ny < 0 || coord.ny > 1,
    };
  });

  const victim = dots.find((d) => d.playerId === kill.victimId);
  const killer = kill.killerId ? dots.find((d) => d.playerId === kill.killerId) : undefined;

  return (
    <div style={{ width: SIZE }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        style={{
          borderRadius: 10,
          background: "#0e1116",
          border: "1px solid var(--border)",
          display: "block",
        }}
      >
        <title>{`Positions at ${kill.killerName ?? "?"} → ${kill.victimName}`}</title>

        {/* Radar background if we have a calibrated map and the PNG loads */}
        {showRadar && (
          // eslint-disable-next-line @next/next/no-img-element
          <image
            href={radarUrl(kill.mapName)}
            x={0}
            y={0}
            width={SIZE}
            height={SIZE}
            opacity={0.85}
            onError={() => setRadarFailed(true)}
            preserveAspectRatio="xMidYMid slice"
          />
        )}

        {/* Faint grid when no radar art is available */}
        {!showRadar &&
          [0.25, 0.5, 0.75].flatMap((f) => [
            <line
              key={`vx${f}`}
              x1={f * SIZE}
              y1={0}
              x2={f * SIZE}
              y2={SIZE}
              stroke="var(--border)"
              strokeWidth={0.5}
              opacity={0.4}
            />,
            <line
              key={`hz${f}`}
              x1={0}
              y1={f * SIZE}
              x2={SIZE}
              y2={f * SIZE}
              stroke="var(--border)"
              strokeWidth={0.5}
              opacity={0.4}
            />,
          ])}

        {/* Kill line: killer → victim */}
        {killer && victim && (
          <line
            x1={killer.px}
            y1={killer.py}
            x2={victim.px}
            y2={victim.py}
            stroke="#ff3b3b"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            opacity={0.8}
          />
        )}

        {/* Player dots */}
        {dots.map((d) => {
          const color = d.team === 1 ? c1 : c2;
          const isVictim = d.playerId === kill.victimId;
          const isKiller = d.playerId === kill.killerId;

          if (isVictim) {
            // Victim: red ✕ marker
            const r = 6;
            return (
              <g key={d.playerId} opacity={d.offmap ? 0.4 : 1}>
                <line x1={d.px - r} y1={d.py - r} x2={d.px + r} y2={d.py + r} stroke="#ff3b3b" strokeWidth={2.5} />
                <line x1={d.px - r} y1={d.py + r} x2={d.px + r} y2={d.py - r} stroke="#ff3b3b" strokeWidth={2.5} />
                <text x={d.px + 9} y={d.py + 3} fontSize={9} fill="#ff6b6b" fontWeight={700}>
                  {d.name}
                </text>
              </g>
            );
          }

          return (
            <g key={d.playerId} opacity={d.offmap ? 0.4 : d.alive ? 1 : 0.45}>
              {isKiller && (
                <circle cx={d.px} cy={d.py} r={9} fill="none" stroke="#ffd166" strokeWidth={2} />
              )}
              <circle
                cx={d.px}
                cy={d.py}
                r={5}
                fill={color}
                stroke="#0e1116"
                strokeWidth={1.5}
              />
              <text x={d.px + 8} y={d.py + 3} fontSize={9} fill="var(--text)" opacity={0.85}>
                {d.name}
              </text>
            </g>
          );
        })}
      </svg>

      {!calibrated && (
        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 6, textAlign: "center" }}>
          No radar calibration for {normalizeMapName(kill.mapName)} — positions shown on a relative grid.
        </div>
      )}
    </div>
  );
}
