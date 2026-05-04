/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import type { ClassicLeague, LeagueMembership } from "@/lib/fpl";
import type { EnrichedEntry } from "./types";
import { CHIP_CLASSES } from "./types";

type LeagueSort = "rank" | "captain" | "gw" | "total" | "chip";

const CHIP_SHORT: Record<string, string> = {
  wildcard: "WC",
  freehit: "FH",
  bboost: "BB",
  "3xc": "TC",
};

const GRID = "20px 1fr 28px 60px 38px 38px";

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
  playerMap: Map<number, { web_name: string }>;
}) {
  const [sort, setSort] = useState<LeagueSort>("rank");

  const raw: EnrichedEntry[] =
    enriched.length > 0
      ? enriched
      : (league?.standings.results.map((e) => ({ ...e })) ?? []);

  const captainName = (entry: EnrichedEntry) =>
    entry.captain ? (playerMap.get(entry.captain)?.web_name ?? "") : "";

  const sorted = [...raw].sort((a, b) => {
    if (sort === "captain") return captainName(a).localeCompare(captainName(b));
    if (sort === "gw") return b.event_total - a.event_total;
    if (sort === "total") return b.total - a.total;
    if (sort === "chip") {
      const ac = a.chipActive ? 1 : 0;
      const bc = b.chipActive ? 1 : 0;
      return bc - ac || a.rank - b.rank;
    }
    return a.rank - b.rank;
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
      {sort === key ? "▼ " : ""}
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
          <select
            value={leagueId ?? ""}
            onChange={(e) => onLeagueChange(parseInt(e.target.value))}
            className="w-full rounded-lg px-[0.6rem] py-[0.35rem] text-[0.78rem] font-semibold cursor-pointer outline-none"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-strong)",
              color: "var(--text-primary)",
            }}
          >
            {leagues.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
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
        <div
          className="p-6 text-center text-[0.82rem]"
          style={{ color: "var(--text-muted)" }}
        >
          Loading…
        </div>
      ) : (
        <div className="overflow-y-auto flex-1 min-h-0">
          {sorted.map((entry, idx) => {
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

            return (
              <div
                key={entry.id}
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
                    color: idx < 3 ? "var(--accent)" : "var(--text-muted)",
                  }}
                >
                  {idx + 1}
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

                <div className="text-right text-[0.78rem] font-semibold">
                  {entry.event_total}
                </div>

                <div
                  className="text-right text-[0.72rem]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {entry.total}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
