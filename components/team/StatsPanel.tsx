/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Activity } from "lucide-react";
import type { ManagerPicks, LiveElement } from "@/lib/fpl";
import type { EnrichedEntry, RightView } from "./types";
import { CHIP_LABELS, CHIP_CLASSES } from "./types";

// ── InPlayView ────────────────────────────────────────────────────────────────

export function InPlayView({
  picks,
  liveMap,
  playerMap,
  teamMap,
  onPlayerClick,
}: {
  picks: ManagerPicks | null;
  liveMap: Map<number, LiveElement>;
  playerMap: Map<number, any>;
  teamMap: Map<number, any>;
  onPlayerClick: (id: number) => void;
}) {
  const inPlay = Array.from(liveMap.values())
    .filter((e) => e.stats.minutes > 0)
    .sort((a, b) => b.stats.total_points - a.stats.total_points)
    .slice(0, 20);

  const myIds = new Set(picks?.picks.map((p) => p.element));

  if (inPlay.length === 0)
    return (
      <div
        className="card flex flex-col items-center justify-center p-8 text-center"
        style={{ color: "var(--text-muted)" }}
      >
        <Activity size={28} className="mb-2 opacity-40" />
        <p className="text-[0.82rem]">No players in play yet this GW</p>
      </div>
    );

  return (
    <div className="card overflow-hidden">
      <div className="px-[0.9rem] py-[0.6rem] border-b border-(--border)">
        <span className="font-bold text-[0.78rem]">Top Players This GW</span>
      </div>
      {inPlay.map((el) => {
        const player = playerMap.get(el.id);
        const team = player ? teamMap.get(player.team) : null;
        const s = el.stats;
        const mine = myIds.has(el.id);
        return (
          <div
            key={el.id}
            className="row-item flex items-center gap-2 px-[0.9rem] py-[0.48rem] cursor-pointer"
            onClick={() => onPlayerClick(el.id)}
            style={{ background: mine ? "rgba(0,214,143,0.05)" : undefined }}
          >
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[0.8rem] truncate">
                {player?.web_name || el.id}
                {mine && (
                  <span className="ml-1 text-[0.6rem]" style={{ color: "var(--accent)" }}>
                    ✓
                  </span>
                )}
              </div>
              <div
                className="flex gap-1 text-[0.64rem]"
                style={{ color: "var(--text-muted)" }}
              >
                <span>{team?.short_name}</span>
                {s.goals_scored > 0 && <span>⚽{s.goals_scored}</span>}
                {s.assists > 0 && <span>🅰️{s.assists}</span>}
                {s.bonus > 0 && <span>⭐{s.bonus}</span>}
                <span>{s.minutes}&apos;</span>
              </div>
            </div>
            <div
              className="text-[1.15rem]"
              style={{
                fontFamily: "var(--font-display)",
                color:
                  s.total_points >= 10 ? "var(--accent)" : "var(--text-primary)",
              }}
            >
              {s.total_points}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── ChipsView ─────────────────────────────────────────────────────────────────

function ChipsView({ enriched }: { enriched: EnrichedEntry[] }) {
  const withChips = enriched.filter((e) => e.chipActive);
  return (
    <div className="card overflow-hidden">
      <div className="px-[0.9rem] py-[0.6rem] border-b border-(--border)">
        <span className="font-bold text-[0.78rem]">Active Chips</span>
      </div>
      {withChips.length === 0 ? (
        <div
          className="p-6 text-center text-[0.82rem]"
          style={{ color: "var(--text-muted)" }}
        >
          No active chips this GW
        </div>
      ) : (
        withChips.map((e) => (
          <div
            key={e.id}
            className="row-item flex items-center gap-2 px-[0.9rem] py-[0.48rem]"
          >
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[0.8rem]">{e.player_name}</div>
              <div
                className="text-[0.65rem] truncate"
                style={{ color: "var(--text-muted)" }}
              >
                {e.entry_name}
              </div>
            </div>
            <span
              className={`badge ${CHIP_CLASSES[e.chipActive!] || "badge-purple"} text-[0.65rem]`}
            >
              {CHIP_LABELS[e.chipActive!] || e.chipActive}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

// ── OwnershipView ─────────────────────────────────────────────────────────────

function OwnershipView({
  enriched,
  playerMap,
  onPlayerClick,
}: {
  enriched: EnrichedEntry[];
  playerMap: Map<number, any>;
  onPlayerClick: (id: number) => void;
}) {
  const owned = new Map<number, number>();
  const captained = new Map<number, number>();
  for (const e of enriched) {
    if (!e.entryPicks) continue;
    for (const p of e.entryPicks) {
      if (p.position <= 11) owned.set(p.element, (owned.get(p.element) || 0) + 1);
      if (p.is_captain) captained.set(p.element, (captained.get(p.element) || 0) + 1);
    }
  }
  const total = enriched.filter((e) => e.entryPicks).length;
  const top = Array.from(owned.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  if (top.length === 0)
    return (
      <div
        className="card p-6 text-center text-[0.82rem]"
        style={{ color: "var(--text-muted)" }}
      >
        Loading ownership data…
      </div>
    );

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-1.5 px-[0.9rem] py-[0.6rem] border-b border-(--border)">
        <span className="font-bold text-[0.78rem]">League Ownership</span>
        <span className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>
          ({total} managers)
        </span>
      </div>
      {top.map(([id, count]) => {
        const player = playerMap.get(id);
        const caps = captained.get(id) || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div
            key={id}
            className="row-item flex items-center gap-2 px-[0.9rem] py-[0.48rem] cursor-pointer"
            onClick={() => onPlayerClick(id)}
          >
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[0.8rem]">{player?.web_name || id}</div>
              <div className="flex items-center gap-[3px] mt-[3px]">
                <div
                  className="h-[3px] rounded-full opacity-70"
                  style={{ width: pct, maxWidth: 80, background: "var(--accent)" }}
                />
                <span className="text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
                  {pct}%
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[0.72rem] font-semibold">
                {count}/{total}
              </div>
              {caps > 0 && (
                <div className="text-[0.58rem]" style={{ color: "var(--warning)" }}>
                  ⭐ {caps} cap{caps > 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── StatsPanel ────────────────────────────────────────────────────────────────

const TABS: [RightView, string][] = [
  ["inplay", "⚡ Live"],
  ["chips", "🃏 Chips"],
  ["ownership", "📊 Owned"],
];

export default function StatsPanel({
  view,
  onViewChange,
  picks,
  liveMap,
  playerMap,
  teamMap,
  enriched,
  onPlayerClick,
}: {
  view: RightView;
  onViewChange: (v: RightView) => void;
  picks: ManagerPicks | null;
  liveMap: Map<number, LiveElement>;
  playerMap: Map<number, any>;
  teamMap: Map<number, any>;
  enriched: EnrichedEntry[];
  onPlayerClick: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-[10px]">
      <div
        className="flex gap-[3px] rounded-[10px] p-[3px]"
        style={{ background: "var(--bg-subtle)" }}
      >
        {TABS.map(([v, label]) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className="flex-1 py-[0.38rem] rounded-[7px] border-0 cursor-pointer font-semibold text-[0.7rem] transition-all duration-150"
            style={{
              background: view === v ? "var(--bg-card)" : "transparent",
              color: view === v ? "var(--text-primary)" : "var(--text-muted)",
              boxShadow: view === v ? "var(--shadow-sm)" : "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {view === "inplay" && (
        <InPlayView
          picks={picks}
          liveMap={liveMap}
          playerMap={playerMap}
          teamMap={teamMap}
          onPlayerClick={onPlayerClick}
        />
      )}
      {view === "chips" && <ChipsView enriched={enriched} />}
      {view === "ownership" && (
        <OwnershipView
          enriched={enriched}
          playerMap={playerMap}
          onPlayerClick={onPlayerClick}
        />
      )}
    </div>
  );
}
