/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { X } from "lucide-react";
import type { ManagerPicks, LiveElement } from "@/lib/fpl";
import {
  getPlayerPhoto,
  getPositionColor,
  getPositionName,
  formatCost,
} from "@/lib/fpl";
import type { EnrichedEntry } from "./types";
import { STAT_META } from "./types";

export default function PlayerModal({
  playerId,
  playerMap,
  teamMap,
  liveMap,
  enriched,
  picks,
  onClose,
}: {
  playerId: number;
  playerMap: Map<number, any>;
  teamMap: Map<number, any>;
  liveMap: Map<number, LiveElement>;
  enriched: EnrichedEntry[];
  picks: ManagerPicks | null;
  onClose: () => void;
}) {
  const player = playerMap.get(playerId);
  const team = player ? teamMap.get(player.team) : null;
  const live = liveMap.get(playerId);
  const s = live?.stats;
  const posColor = player ? getPositionColor(player.element_type) : "#fff";

  const breakdown: {
    label: string;
    emoji: string;
    value: number;
    pts: number;
  }[] = [];
  if (live?.explain) {
    for (const row of live.explain) {
      for (const stat of row.stats) {
        if (stat.points !== 0) {
          const [label, emoji] = STAT_META[stat.identifier] || [
            stat.identifier,
            "",
          ];
          breakdown.push({ label, emoji, value: stat.value, pts: stat.points });
        }
      }
    }
  }

  const owners = enriched
    .filter((e) => e.entryPicks?.some((p) => p.element === playerId))
    .map((e) => {
      const pick = e.entryPicks!.find((p) => p.element === playerId)!;
      return {
        name: e.player_name,
        team: e.entry_name,
        isCaptain: pick.is_captain,
        isVC: pick.is_vice_captain,
        isStarting: pick.position <= 11,
      };
    });

  const myPick = picks?.picks.find((p) => p.element === playerId);

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-fade-in-up relative w-full overflow-y-auto px-5 pb-8 pt-3"
        style={{
          background: "var(--bg-card)",
          borderRadius: "20px 20px 0 0",
          maxWidth: 520,
          maxHeight: "88vh",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.4)",
        }}
      >
        <div
          className="mx-auto mb-4 h-1 w-9 rounded-full"
          style={{ background: "var(--border-strong)" }}
        />
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 flex items-center justify-center rounded-full cursor-pointer border-0"
          style={{
            width: 30,
            height: 30,
            background: "var(--bg-subtle)",
            color: "var(--text-muted)",
          }}
        >
          <X size={15} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <img
            src={player ? getPlayerPhoto(player.code) : ""}
            alt={player?.web_name}
            className="rounded-[10px] object-cover shrink-0"
            style={{ width: 54, height: 68, background: "var(--bg-subtle)" }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-[5px] mb-1">
              <span
                className="badge text-[0.62rem]"
                style={{ background: posColor + "20", color: posColor }}
              >
                {player ? getPositionName(player.element_type) : "?"}
              </span>
              {myPick?.is_captain && (
                <span className="badge badge-yellow text-[0.62rem]">Captain</span>
              )}
              {myPick?.is_vice_captain && (
                <span className="badge badge-blue text-[0.62rem]">Vice-Cap</span>
              )}
            </div>
            <h2
              className="leading-none"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                letterSpacing: 1,
              }}
            >
              {player?.web_name || "—"}
            </h2>
            <p className="text-[0.75rem] mt-0.5" style={{ color: "var(--text-muted)" }}>
              {player?.first_name} {player?.second_name} · {team?.name} ·{" "}
              {formatCost(player?.now_cost || 0)}
            </p>
          </div>
          {s && (
            <div className="text-center shrink-0">
              <div
                className="leading-none"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "2.8rem",
                  color:
                    s.total_points >= 10 ? "var(--accent)" : "var(--text-primary)",
                }}
              >
                {s.total_points * (myPick?.multiplier || 1)}
              </div>
              <div
                className="text-[0.6rem] uppercase tracking-widest"
                style={{ color: "var(--text-muted)" }}
              >
                {myPick && myPick.multiplier > 1
                  ? `×${myPick.multiplier} pts`
                  : "pts"}
              </div>
            </div>
          )}
        </div>

        {/* Points breakdown */}
        {breakdown.length > 0 && (
          <div className="mb-5">
            <div
              className="text-[0.68rem] uppercase tracking-widest mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Points Breakdown
            </div>
            <div className="flex flex-col gap-[3px]">
              {breakdown.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-[0.38rem] rounded-lg"
                  style={{ background: "var(--bg-subtle)" }}
                >
                  <span className="w-5 text-[0.88rem]">{item.emoji}</span>
                  <span className="flex-1 text-[0.82rem] font-medium">
                    {item.label}
                  </span>
                  <span
                    className="text-[0.72rem]"
                    style={{ color: "var(--text-muted)" }}
                  >
                    ×{item.value}
                  </span>
                  <span
                    className="min-w-[28px] text-right text-[0.88rem] font-bold"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: item.pts > 0 ? "var(--accent)" : "var(--danger)",
                    }}
                  >
                    {item.pts > 0 ? "+" : ""}
                    {item.pts}
                  </span>
                </div>
              ))}
              <div className="flex items-center px-3 py-[0.38rem] border-t border-(--border) mt-0.5">
                <span className="flex-1 text-[0.82rem] font-bold">Total</span>
                <span
                  className="text-[0.95rem] font-bold"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--accent)",
                  }}
                >
                  {s?.total_points}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* League ownership */}
        {owners.length > 0 && (
          <div>
            <div
              className="text-[0.68rem] uppercase tracking-widest mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              In League — {owners.length} manager
              {owners.length !== 1 ? "s" : ""}
            </div>
            <div className="flex flex-col gap-[3px]">
              {owners.map((o, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-[0.38rem] rounded-lg"
                  style={{ background: "var(--bg-subtle)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[0.8rem]">{o.name}</div>
                    <div
                      className="text-[0.65rem] truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {o.team}
                    </div>
                  </div>
                  <div className="flex gap-[3px] shrink-0">
                    {!o.isStarting && (
                      <span className="badge badge-blue text-[0.58rem]">Sub</span>
                    )}
                    {o.isCaptain && (
                      <span className="badge badge-yellow text-[0.58rem]">Cap</span>
                    )}
                    {o.isVC && (
                      <span className="badge badge-blue text-[0.58rem]">VC</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {breakdown.length === 0 && owners.length === 0 && (
          <div
            className="py-4 text-center text-[0.85rem]"
            style={{ color: "var(--text-muted)" }}
          >
            No live data available yet for this player
          </div>
        )}
      </div>
    </div>
  );
}
