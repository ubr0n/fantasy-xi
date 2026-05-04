/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Shield,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ManagerInfo, ManagerPicks, LiveElement } from "@/lib/fpl";
import { TableRowSkeleton } from "@/components/Skeleton";
import { CHIP_LABELS, CHIP_CLASSES } from "./types";
import PlayerRow from "./PlayerRow";
import PitchView from "./PitchView";

export default function TeamPanel({
  manager,
  myManager,
  picks,
  liveMap,
  playerMap,
  teamMap,
  loading,
  liveTotal,
  liveBench,
  activeGW,
  maxGW,
  gwEvents,
  onGWChange,
  onPlayerClick,
  isViewing,
  onBack,
  isMobile,
  onRefresh,
}: {
  manager: ManagerInfo | null;
  myManager: ManagerInfo;
  picks: ManagerPicks | null;
  liveMap: Map<number, LiveElement>;
  playerMap: Map<number, any>;
  teamMap: Map<number, any>;
  loading: boolean;
  liveTotal: number;
  liveBench: number;
  activeGW: number;
  maxGW: number;
  gwEvents: any[];
  onGWChange: (gw: number) => void;
  onPlayerClick: (id: number) => void;
  isViewing: boolean;
  onBack: () => void;
  isMobile: boolean;
  onRefresh: () => void;
}) {
  const m = manager || myManager;
  const [viewMode, setViewMode] = useState<"list" | "pitch">("list");

  return (
    <div className="flex flex-col gap-2.5">
      {/* Top bar */}
      <div className="flex items-center gap-2">
        {isMobile && (
          <Link href="/" style={{ textDecoration: "none" }}>
            <button className="btn-ghost flex items-center gap-1 px-3 py-[0.4rem] text-[0.8rem]">
              <ArrowLeft size={13} />
            </button>
          </Link>
        )}
        {isViewing && (
          <button
            className="btn-ghost flex items-center gap-1 px-3 py-[0.4rem] text-[0.8rem]"
            onClick={onBack}
          >
            <ArrowLeft size={13} /> My Team
          </button>
        )}
        <div className="flex-1" />
        <button
          className="btn-ghost flex items-center gap-1 px-3 py-[0.4rem] text-[0.8rem]"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw
            size={12}
            className={loading ? "animate-spin-custom" : ""}
          />
        </button>
      </div>

      {/* Manager card */}
      <div className="card relative overflow-hidden px-5 py-4">
        <div
          className="absolute top-0 right-0 h-full w-[40%] pointer-events-none opacity-20"
          style={{
            background:
              "linear-gradient(135deg,transparent,var(--accent-glow))",
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2 items-center">
            <div
              className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-white text-[1.2rem]"
              style={{
                background: isViewing ? "var(--accent2)" : "var(--accent)",
                fontFamily: "var(--font-display)",
              }}
            >
              {m.player_first_name[0]}
              {m.player_last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-[0.6rem] uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                {isViewing ? "Viewing Team" : "My Team"}
              </div>
              <div
                className="leading-none tracking-[1px] text-lg lg:text-xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {m.player_first_name} {m.player_last_name}
              </div>
              <div
                className="text-[0.75rem]"
                style={{ color: "var(--text-secondary)" }}
              >
                {m.name}
              </div>
              {picks?.active_chip && (
                <span
                  className={`badge ${CHIP_CLASSES[picks.active_chip] || "badge-purple"} mt-1 inline-flex`}
                >
                  ⚡ {CHIP_LABELS[picks.active_chip] || picks.active_chip}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-between max-w-72 w-full gap-3.5">
            {[
              { label: "GW Live", val: liveTotal, accent: true },
              { label: "Overall", val: m.summary_overall_points },
              {
                label: "Rank",
                val: m.summary_overall_rank?.toLocaleString() ?? "—",
              },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div
                  className="leading-none text-[1.5rem]"
                  style={{
                    fontFamily: "var(--font-display)",
                    color: s.accent ? "var(--accent)" : "var(--text-primary)",
                  }}
                >
                  {s.val}
                </div>
                <div
                  className="text-[0.58rem] uppercase tracking-widest mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GW selector */}
      <div className="flex items-center gap-1.25">
        <button
          className="btn-ghost px-[0.55rem] py-[0.3rem] shrink-0"
          onClick={() => activeGW > 1 && onGWChange(activeGW - 1)}
          disabled={activeGW <= 1}
        >
          <ChevronLeft size={13} />
        </button>
        <div
          className="flex-1 flex gap-1 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {gwEvents
            .filter((e) => e.finished || e.is_current)
            .slice(-12)
            .map((e: any) => (
              <button
                key={e.id}
                onClick={() => onGWChange(e.id)}
                className="shrink-0 rounded-full text-[0.7rem] font-semibold border-0 cursor-pointer transition-all duration-150 px-2.25 py-0.75"
                style={{
                  background:
                    e.id === activeGW ? "var(--accent)" : "var(--bg-subtle)",
                  color: e.id === activeGW ? "#000" : "var(--text-secondary)",
                }}
              >
                {e.id}
              </button>
            ))}
        </div>
        <button
          className="btn-ghost px-[0.55rem] py-[0.3rem] shrink-0"
          onClick={() => activeGW < maxGW && onGWChange(activeGW + 1)}
          disabled={activeGW >= maxGW}
        >
          <ChevronRight size={13} />
        </button>
      </div>

      {/* Squad */}
      {loading ? (
        <div className="flex flex-col gap-1.5">
          {[1, 2, 3].map((i) => (
            <TableRowSkeleton key={i} />
          ))}
        </div>
      ) : !picks ? (
        <div
          className="card p-8 text-center"
          style={{ color: "var(--text-muted)" }}
        >
          <Shield size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-[0.85rem]">Team picks not available</p>
        </div>
      ) : (
        <>
          <div
            className="flex flex-wrap items-center gap-3 rounded-[10px] px-[0.9rem] py-[0.55rem] text-[0.78rem]"
            style={{ background: "var(--bg-subtle)" }}
          >
            <span style={{ color: "var(--text-muted)" }}>
              Bench:{" "}
              <strong style={{ color: "var(--accent)" }}>
                {liveBench} pts
              </strong>
            </span>
            {picks.entry_history?.event_transfers > 0 && (
              <span style={{ color: "var(--text-muted)" }}>
                Transfers:{" "}
                <strong>{picks.entry_history.event_transfers}</strong>
                {picks.entry_history.event_transfers_cost > 0 && (
                  <span style={{ color: "var(--danger)" }}>
                    {" "}
                    (-{picks.entry_history.event_transfers_cost})
                  </span>
                )}
              </span>
            )}
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center gap-1.25 px-[0.9rem] py-[0.55rem] border-b border-(--border)">
              <Zap size={12} style={{ color: "var(--accent)" }} />
              <span className="font-bold text-[0.78rem] flex-1">
                Starting XI
              </span>
              <div
                className="flex gap-0.5 rounded-md p-0.5"
                style={{ background: "var(--bg-subtle)" }}
              >
                {(["list", "pitch"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className="rounded-sm border-0 cursor-pointer text-[0.65rem] font-semibold transition-all duration-150 px-2 py-0.5"
                    style={{
                      background:
                        viewMode === mode ? "var(--bg-card)" : "transparent",
                      color:
                        viewMode === mode
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                    }}
                  >
                    {mode === "list" ? "≡ List" : "⬛ Pitch"}
                  </button>
                ))}
              </div>
            </div>
            {viewMode === "list" ? (
              picks.picks
                .filter((p) => p.position <= 11)
                .sort((a, b) => a.position - b.position)
                .map((pick) => (
                  <PlayerRow
                    key={pick.element}
                    pick={pick}
                    playerMap={playerMap}
                    teamMap={teamMap}
                    liveMap={liveMap}
                    liveTotal={liveTotal}
                    onClick={() => onPlayerClick(pick.element)}
                  />
                ))
            ) : (
              <PitchView
                picks={picks}
                playerMap={playerMap}
                liveMap={liveMap}
                liveTotal={liveTotal}
                onPlayerClick={onPlayerClick}
              />
            )}
          </div>

          {viewMode === "list" && (
            <div className="card overflow-hidden">
              <div className="px-[0.9rem] py-[0.55rem] border-b border-(--border)">
                <span
                  className="font-bold text-[0.78rem]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Bench
                </span>
              </div>
              {picks.picks
                .filter((p) => p.position > 11)
                .sort((a, b) => a.position - b.position)
                .map((pick) => (
                  <PlayerRow
                    key={pick.element}
                    pick={pick}
                    playerMap={playerMap}
                    teamMap={teamMap}
                    liveMap={liveMap}
                    isBench
                    onClick={() => onPlayerClick(pick.element)}
                  />
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
