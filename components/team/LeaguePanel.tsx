"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ClassicLeague, Fixture, GameWeek, LeagueMembership, Player } from "@/lib/fpl";
import { liveSeasonTotal } from "@/lib/fpl";
import { computeLiveProgress, effectiveStartingElements } from "@/lib/autoSubs";
import type { EnrichedEntry } from "./types";
import { CHIP_CLASSES } from "./types";
import { TableRowSkeleton } from "@/components/Skeleton";
import LeagueSelect from "./LeagueSelect";

type LeagueSort = "rank" | "captain" | "gw" | "total" | "chip";

const CHIP_SHORT: Record<string, string> = {
  wildcard: "WC",
  freehit: "FH",
  bboost: "BB",
  "3xc": "TC",
};

const GRID = "20px 1fr 28px 60px 46px 38px";

export default function LeaguePanel({
  league,
  enriched,
  currentGW,
  managerId,
  viewedId,
  onManagerClick,
  leagues,
  leagueId,
  onLeagueChange,
  playerMap,
  fixtures,
  gwEvents,
  maxGW,
  onGWChange,
}: {
  league: ClassicLeague | null;
  enriched: EnrichedEntry[];
  currentGW: number;
  managerId: number;
  viewedId: number | null;
  onManagerClick: (id: number) => void;
  leagues: LeagueMembership[];
  leagueId: number | null;
  onLeagueChange: (id: number) => void;
  playerMap: Map<number, Player>;
  fixtures: Fixture[];
  gwEvents: GameWeek[];
  maxGW: number;
  onGWChange: (gw: number) => void;
}) {
  const [sort, setSort] = useState<LeagueSort>("rank");

  const raw: EnrichedEntry[] =
    enriched.length > 0
      ? enriched
      : (league?.standings.results.map((e) => ({ ...e })) ?? []);

  const captainName = (entry: EnrichedEntry) =>
    entry.captain ? (playerMap.get(entry.captain)?.web_name ?? "") : "";

  const seasonTotalOf = (entry: EnrichedEntry) =>
    entry.seasonTotal ?? liveSeasonTotal(entry);
  const gwPointsOf = (entry: EnrichedEntry) => entry.gwPoints ?? entry.event_total;

  // The value being compared for the active sort — used to detect ties so
  // equally-placed entries share a rank (1, 1, 1, 4, 5, 6, 6, 8, ...).
  const sortValue = (entry: EnrichedEntry): string | number => {
    if (sort === "captain") return captainName(entry);
    if (sort === "gw") return entry.livePoints ?? gwPointsOf(entry);
    if (sort === "total") return seasonTotalOf(entry);
    if (sort === "chip") return entry.chipActive ? 1 : 0;
    return entry.rank;
  };

  const sorted = [...raw].sort((a, b) => {
    if (sort === "captain") return captainName(a).localeCompare(captainName(b));
    if (sort === "gw")
      return (b.livePoints ?? gwPointsOf(b)) - (a.livePoints ?? gwPointsOf(a));
    if (sort === "total") return seasonTotalOf(b) - seasonTotalOf(a);
    if (sort === "chip") {
      const ac = a.chipActive ? 1 : 0;
      const bc = b.chipActive ? 1 : 0;
      return bc - ac || a.rank - b.rank;
    }
    return a.rank - b.rank;
  });

  const displayRanks: number[] = [];
  sorted.forEach((entry, i) => {
    displayRanks.push(
      i > 0 && sortValue(entry) === sortValue(sorted[i - 1])
        ? displayRanks[i - 1]
        : i + 1,
    );
  });

  const colHdr = (
    key: LeagueSort,
    label: string,
    align: "left" | "right" = "right",
  ) => (
    <span
      onClick={() => setSort(key)}
      className="cursor-pointer text-[0.6rem] font-bold uppercase tracking-[0.5px] select-none"
      style={{
        color: sort === key ? "var(--accent)" : "var(--text-muted)",
        textAlign: align,
      }}
    >
      {label}
    </span>
  );

  return (
    <div className="card overflow-hidden flex flex-col flex-1 min-h-0">
      {/* League selector */}
      <div
        className="shrink-0 border-b border-(--border) px-[0.9rem] py-[0.65rem]"
        style={{ background: "var(--bg-subtle)" }}
      >
        <div
          className="text-[0.6rem] uppercase tracking-widest mb-1"
          style={{ color: "var(--text-muted)" }}
        >
          League
        </div>
        {leagues.length > 1 ? (
          <LeagueSelect
            leagues={leagues}
            value={leagueId}
            onChange={onLeagueChange}
          />
        ) : (
          <div className="font-bold text-[0.85rem] leading-tight">
            {league?.league.name ?? "—"}
          </div>
        )}
        <div
          className="text-[0.65rem] mt-1"
          style={{ color: "var(--text-muted)" }}
        >
          {!league ? "Loading…" : `GW${currentGW} · ${raw.length} managers`}
        </div>
      </div>

      {/* Gameweek selector */}
      <div
        className="shrink-0 flex items-center gap-1 px-[0.7rem] py-[0.4rem] border-b border-(--border)"
        style={{ background: "var(--bg-subtle)" }}
      >
        <button
          className="btn-ghost px-1 py-0.5 shrink-0"
          onClick={() => currentGW > 1 && onGWChange(currentGW - 1)}
          disabled={currentGW <= 1}
        >
          <ChevronLeft size={12} />
        </button>
        <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar">
          {gwEvents
            .filter((e) => e.finished || e.is_current)
            .map((e) => (
              <button
                key={e.id}
                onClick={() => onGWChange(e.id)}
                className="shrink-0 rounded-full text-[0.62rem] font-semibold border-0 cursor-pointer transition-all duration-150 px-1.75 py-0.5"
                style={{
                  background:
                    e.id === currentGW ? "var(--accent)" : "var(--bg-card)",
                  color: e.id === currentGW ? "#000" : "var(--text-secondary)",
                }}
              >
                {e.id}
              </button>
            ))}
        </div>
        <button
          className="btn-ghost px-1 py-0.5 shrink-0"
          onClick={() => currentGW < maxGW && onGWChange(currentGW + 1)}
          disabled={currentGW >= maxGW}
        >
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Column headers */}
      <div
        className="shrink-0 grid gap-1 px-[0.9rem] py-[0.35rem] border-b border-(--border)"
        style={{ gridTemplateColumns: GRID, background: "var(--bg-subtle)" }}
      >
        <span
          className="text-[0.6rem] font-bold"
          style={{ color: "var(--text-muted)" }}
        >
          #
        </span>
        <span
          className="text-[0.6rem] font-bold uppercase tracking-[0.5px]"
          style={{ color: "var(--text-muted)" }}
        >
          Manager
        </span>
        {colHdr("chip", "Chip", "left")}
        {colHdr("captain", "Captain")}
        {colHdr("gw", "GW")}
        {colHdr("total", "Total")}
      </div>

      {!league ? (
        <div className="overflow-y-auto flex-1 min-h-0">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <TableRowSkeleton key={i} cols={4} />
          ))}
        </div>
      ) : (
        <div className="overflow-y-auto flex-1 min-h-0">
          {sorted.map((entry, idx) => {
            const displayRank = displayRanks[idx];
            const change = entry.last_rank - entry.rank;
            const captain = entry.captain
              ? (playerMap.get(entry.captain)?.web_name ?? "—")
              : "—";
            const isMe = entry.entry === managerId;
            const isActive =
              viewedId === null ? isMe : entry.entry === viewedId;
            const chipShort = entry.chipActive
              ? (CHIP_SHORT[entry.chipActive] ??
                entry.chipActive.toUpperCase().slice(0, 2))
              : null;
            const effectiveElements = entry.entryPicks
              ? effectiveStartingElements(
                  entry.entryPicks,
                  entry.subs ?? [],
                  entry.chipActive === "bboost",
                )
              : [];
            const { inPlay, toPlay } = computeLiveProgress(
              effectiveElements,
              playerMap,
              fixtures,
            );

            return (
              <div
                key={entry.entry}
                className="row-item grid gap-1 px-[0.9rem] py-2 cursor-pointer items-center"
                onClick={() => onManagerClick(entry.entry)}
                style={{
                  gridTemplateColumns: GRID,
                  background: isMe
                    ? "rgb(203, 195, 227,0.25)"
                    : isActive
                      ? "rgba(0,214,143,0.08)"
                      : undefined,
                  borderLeft: isActive
                    ? "5px solid var(--accent)"
                    : isMe
                      ? "5px solid rgba(0,214,143)"
                      : "2px solid transparent",
                }}
              >
                <span
                  className="text-[0.68rem] font-bold"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color:
                      displayRank <= 3 ? "var(--accent)" : "var(--text-muted)",
                  }}
                >
                  {displayRank}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-0.75 font-semibold text-[0.75rem]">
                    <span className="truncate">{entry.entry_name}</span>
                    {isMe && (
                      <span
                        className="text-[0.7rem] shrink-0 font-extrabold"
                        style={{ color: "var(--accent)" }}
                      >
                        (YOU)
                      </span>
                    )}
                    {change !== 0 && (
                      <span
                        className="text-[0.55rem] shrink-0"
                        style={{
                          color: change > 0 ? "var(--accent)" : "var(--danger)",
                        }}
                      >
                        {change > 0 ? "▲" : "▼"}
                        {Math.abs(change)}
                      </span>
                    )}
                  </div>
                  <div
                    className="text-[0.62rem] truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {entry.player_name}
                  </div>
                </div>

                <div>
                  {chipShort && (
                    <span
                      className={`badge ${CHIP_CLASSES[entry.chipActive!] || "badge-purple"} text-[0.5rem]`}
                      style={{ padding: "1px 3px" }}
                    >
                      {chipShort}
                    </span>
                  )}
                </div>

                <div
                  className="text-right text-[0.65rem] font-semibold"
                  style={{ color: "var(--accent)" }}
                >
                  {captain}
                </div>

                <div
                  className="text-right"
                  title={
                    inPlay > 0 || toPlay > 0
                      ? `${inPlay} in play · ${toPlay} yet to play`
                      : undefined
                  }
                >
                  <div className="text-[0.78rem] font-semibold">
                    {entry.livePoints ?? entry.event_total}
                  </div>
                  {(inPlay > 0 || toPlay > 0) && (
                    <div className="flex items-center justify-end gap-0.75 mt-0.5">
                      {inPlay > 0 && (
                        <span className="flex items-center gap-0.5">
                          <span
                            className="live-dot"
                            style={{ width: 5, height: 5 }}
                          />
                          <span
                            className="text-[0.55rem] font-bold"
                            style={{ color: "var(--danger)" }}
                          >
                            {inPlay}
                          </span>
                        </span>
                      )}
                      {toPlay > 0 && (
                        <span
                          className="text-[0.55rem] font-semibold"
                          style={{ color: "var(--text-muted)" }}
                        >
                          +{toPlay}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div
                  className="text-right text-[0.72rem]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {seasonTotalOf(entry)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
