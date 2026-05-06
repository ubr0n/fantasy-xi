/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useRef } from "react";
import { Activity, Radio } from "lucide-react";
import type { ManagerPicks, LiveElement, LiveGameweek, LiveStats } from "@/lib/fpl";
import type { EnrichedEntry, RightView } from "./types";
import { CHIP_LABELS, CHIP_CLASSES } from "./types";

// ── Feed types & hook ─────────────────────────────────────────────────────────

interface FeedEvent {
  key: string;
  at: number;
  playerId: number;
  emoji: string;
  label: string;
  newTotal: number;
  isMine: boolean;
  isLive: boolean;
}

function formatAge(ms: number): string {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function useLiveFeed(liveData: LiveGameweek | null, picks: ManagerPicks | null): FeedEvent[] {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const prevRef = useRef<Map<number, LiveStats> | null>(null);

  useEffect(() => {
    if (!liveData) return;
    const myIds = new Set(picks?.picks.map((p) => p.element) ?? []);
    const now = Date.now();
    const isInit = prevRef.current === null;
    const newEvents: FeedEvent[] = [];

    liveData.elements.forEach((el) => {
      const s = el.stats;
      const prev = prevRef.current?.get(el.id) ?? null;
      const isMine = myIds.has(el.id);

      const push = (emoji: string, label: string, suffix: string) => {
        newEvents.push({ key: `${el.id}-${suffix}-${now}`, at: now, playerId: el.id, emoji, label, newTotal: s.total_points, isMine, isLive: !isInit });
      };

      if (isInit) {
        const notable = s.goals_scored > 0 || s.assists > 0 || s.own_goals > 0 ||
          s.yellow_cards > 0 || s.red_cards > 0 || s.penalties_saved > 0 ||
          s.penalties_missed > 0 || s.clean_sheets > 0 || s.bonus > 0 || s.saves >= 3;
        if (!notable) return;
        if (s.goals_scored > 0) push("⚽", s.goals_scored > 1 ? `${s.goals_scored} goals` : "scored", "g");
        if (s.assists > 0) push("🅰️", s.assists > 1 ? `${s.assists} assists` : "assisted", "a");
        if (s.own_goals > 0) push("❌", "own goal", "og");
        if (s.yellow_cards > 0) push("🟨", "yellow card", "yc");
        if (s.red_cards > 0) push("🟥", "red card", "rc");
        if (s.clean_sheets > 0) push("🧤", "clean sheet", "cs");
        if (s.penalties_saved > 0) push("🥅", "penalty saved", "ps");
        if (s.penalties_missed > 0) push("❌", "penalty missed", "pm");
        if (s.saves >= 3) push("🧤", `${s.saves} saves`, "sv");
        if (s.bonus > 0) push("⭐", `+${s.bonus} bonus`, "bn");
      } else if (prev) {
        const d = (k: keyof LiveStats) => (s[k] as number) - (prev[k] as number);
        if (d("goals_scored") > 0) push("⚽", d("goals_scored") > 1 ? `${d("goals_scored")} goals` : "scored", "g");
        if (d("assists") > 0) push("🅰️", d("assists") > 1 ? `${d("assists")} assists` : "assisted", "a");
        if (d("own_goals") > 0) push("❌", "own goal", "og");
        if (d("yellow_cards") > 0) push("🟨", "yellow card", "yc");
        if (d("red_cards") > 0) push("🟥", "red card", "rc");
        if (d("penalties_saved") > 0) push("🥅", "penalty saved", "ps");
        if (d("penalties_missed") > 0) push("❌", "penalty missed", "pm");
        if (prev.clean_sheets === 0 && s.clean_sheets > 0) push("🧤", "clean sheet", "cs");
        if (prev.clean_sheets > 0 && s.clean_sheets === 0) push("💥", "clean sheet lost", "cs_lost");
        const bnDelta = d("bonus");
        if (bnDelta > 0) push("⭐", `+${bnDelta} bonus`, "bn");
        if (bnDelta < 0) push("⭐", `${bnDelta} bonus`, "bn_drop");
        for (let t = 2; t <= 10; t += 2) {
          if (prev.goals_conceded < t && s.goals_conceded >= t) {
            push("⬇️", `${s.goals_conceded} conceded`, "gc");
            break;
          }
        }
        if (Math.floor(s.saves / 3) > Math.floor(prev.saves / 3)) push("🧤", `${s.saves} saves`, "sv");
      }
    });

    const snap = new Map<number, LiveStats>();
    liveData.elements.forEach((el) => snap.set(el.id, { ...el.stats }));
    prevRef.current = snap;

    if (newEvents.length === 0) return;

    setEvents((prev) => {
      if (isInit) {
        return newEvents.sort((a, b) => {
          if (a.isMine !== b.isMine) return a.isMine ? -1 : 1;
          return b.newTotal - a.newTotal;
        });
      }
      return [...newEvents, ...prev].slice(0, 60);
    });
  }, [liveData]); // eslint-disable-line react-hooks/exhaustive-deps

  return events;
}

// ── LiveFeedView ──────────────────────────────────────────────────────────────

function LiveFeedView({
  events,
  playerMap,
  teamMap,
}: {
  events: FeedEvent[];
  playerMap: Map<number, any>;
  teamMap: Map<number, any>;
}) {
  if (events.length === 0)
    return (
      <div
        className="card flex flex-col items-center justify-center p-8 text-center"
        style={{ minHeight: 180, color: "var(--text-muted)" }}
      >
        <Radio size={26} className="mb-2 opacity-40" />
        <p className="text-[0.82rem]">Watching for live events…</p>
        <p className="text-[0.7rem] mt-1 opacity-60">Events will appear as the gameweek progresses</p>
      </div>
    );

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-1.5 px-[0.9rem] py-[0.6rem] border-b border-(--border)">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: "var(--accent)" }}
        />
        <span className="font-bold text-[0.78rem]">Live Feed</span>
        <span className="text-[0.65rem] ml-auto" style={{ color: "var(--text-muted)" }}>
          {events.length} events
        </span>
      </div>
      {events.map((ev) => {
        const player = playerMap.get(ev.playerId);
        const team = player ? teamMap.get(player.team) : null;
        return (
          <div
            key={ev.key}
            className="row-item flex items-center gap-2 px-[0.9rem] py-[0.45rem]"
            style={{
              borderLeft: ev.isMine ? "2.5px solid var(--accent)" : "2.5px solid transparent",
              background: ev.isLive && ev.isMine
                ? "rgba(0,214,143,0.06)"
                : ev.isLive
                  ? "rgba(255,255,255,0.015)"
                  : undefined,
            }}
          >
            <span className="text-[1rem] shrink-0 w-6 text-center">{ev.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 font-semibold text-[0.8rem]">
                <span className="truncate">{player?.web_name ?? ev.playerId}</span>
                {ev.isMine && (
                  <span
                    className="shrink-0 text-[0.52rem] font-bold px-1 py-px rounded"
                    style={{ background: "rgba(0,214,143,0.15)", color: "var(--accent)" }}
                  >
                    YOURS
                  </span>
                )}
                {ev.isLive && (
                  <span
                    className="shrink-0 text-[0.52rem] font-bold px-1 py-px rounded"
                    style={{ background: "rgba(239,68,68,0.15)", color: "#f87171" }}
                  >
                    NEW
                  </span>
                )}
              </div>
              <div
                className="flex items-center gap-1.5 text-[0.64rem]"
                style={{ color: "var(--text-muted)" }}
              >
                <span>{ev.label}</span>
                {team && <span>· {team.short_name}</span>}
                <span className="ml-auto">{ev.isLive ? formatAge(ev.at) : "GW"}</span>
              </div>
            </div>
            <div
              className="shrink-0 min-w-[30px] text-right text-[1.05rem]"
              style={{
                fontFamily: "var(--font-display)",
                color:
                  ev.newTotal >= 10
                    ? "var(--accent)"
                    : ev.newTotal <= 0
                      ? "var(--danger)"
                      : "var(--text-primary)",
              }}
            >
              {ev.newTotal}
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
  ["feed", "📡 Feed"],
  ["chips", "🃏 Chips"],
  ["ownership", "📊 Owned"],
];

export default function StatsPanel({
  view,
  onViewChange,
  picks,
  liveData,
  liveMap,
  playerMap,
  teamMap,
  enriched,
  onPlayerClick,
}: {
  view: RightView;
  onViewChange: (v: RightView) => void;
  picks: ManagerPicks | null;
  liveData: LiveGameweek | null;
  liveMap: Map<number, LiveElement>;
  playerMap: Map<number, any>;
  teamMap: Map<number, any>;
  enriched: EnrichedEntry[];
  onPlayerClick: (id: number) => void;
}) {
  const feedEvents = useLiveFeed(liveData, picks);

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
      {view === "feed" && (
        <LiveFeedView
          events={feedEvents}
          playerMap={playerMap}
          teamMap={teamMap}
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
