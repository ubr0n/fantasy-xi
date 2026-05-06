/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Image from "next/image";
import type { Pick as FplPick, LiveElement } from "@/lib/fpl";
import { getPositionColor, getPositionName, getPlayerPhoto } from "@/lib/fpl";

export default function PlayerRow({
  pick,
  playerMap,
  teamMap,
  liveMap,
  isBench,
  liveTotal,
  onClick,
}: {
  pick: FplPick;
  playerMap: Map<number, any>;
  teamMap: Map<number, any>;
  liveMap: Map<number, LiveElement>;
  isBench?: boolean;
  liveTotal?: number;
  onClick?: () => void;
}) {
  const player = playerMap.get(pick.element);
  const team = player ? teamMap.get(player.team) : null;
  const live = liveMap.get(pick.element);
  const rawPts = live ? live.stats.total_points : player?.event_points || 0;
  const pts = isBench ? rawPts : live ? rawPts * pick.multiplier : rawPts;
  const posColor = player ? getPositionColor(player.element_type) : "#fff";
  const s = live?.stats;
  const contribPct =
    liveTotal && liveTotal > 0
      ? Math.min(100, Math.max(0, Math.round((pts / liveTotal) * 100)))
      : 0;

  return (
    <div
      className="row-item flex items-center gap-[9px] py-2 px-[0.9rem]"
      style={{ opacity: isBench ? 0.6 : 1, cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
    >
      <span
        className="badge min-w-8 justify-center text-[0.6rem]"
        style={{ background: posColor + "20", color: posColor }}
      >
        {player ? getPositionName(player.element_type) : "?"}
      </span>
      <Image
        src={player ? getPlayerPhoto(player.code) : ""}
        alt={player?.web_name ?? ""}
        width={40}
        height={40}
        className="rounded-[5px] object-cover shrink-0"
        style={{ background: "var(--bg-subtle)" }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 font-semibold text-[0.83rem]">
          <span className="truncate">{player?.web_name || "—"}</span>
          {pick.is_captain && (
            <span className="badge badge-yellow shrink-0 text-[0.52rem] py-px px-1">
              C{pick.multiplier > 1 ? `×${pick.multiplier}` : ""}
            </span>
          )}
          {pick.is_vice_captain && (
            <span className="badge badge-blue shrink-0 text-[0.52rem] py-px px-1">
              VC
            </span>
          )}
        </div>
        <div
          className="flex flex-wrap gap-[5px] text-[0.66rem]"
          style={{ color: "var(--text-muted)" }}
        >
          <span>{team?.short_name}</span>
          {s && (
            <>
              {s.goals_scored > 0 && <span>⚽{s.goals_scored}</span>}
              {s.assists > 0 && <span>🅰️{s.assists}</span>}
              {s.yellow_cards > 0 && <span>🟨</span>}
              {s.red_cards > 0 && <span>🟥</span>}
              {s.bonus > 0 && <span>⭐{s.bonus}</span>}
              <span>{s.minutes}&apos;</span>
            </>
          )}
        </div>
        {!isBench && (
          <div className="flex items-center gap-[5px] mt-[3px]">
            <div
              className="flex-1 h-0.5 rounded-full overflow-hidden"
              style={{ background: "var(--border)" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-[400ms]"
                style={{ background: posColor, opacity: 0.75, width: `${contribPct}%` }}
              />
            </div>
            {player?.form && (
              <span
                className="text-[0.56rem] font-bold shrink-0"
                style={{
                  color:
                    parseFloat(player.form) >= 6
                      ? "var(--accent)"
                      : parseFloat(player.form) >= 4
                        ? "var(--text-secondary)"
                        : "var(--text-muted)",
                }}
              >
                f{parseFloat(player.form).toFixed(1)}
              </span>
            )}
            {player?.selected_by_percent && (
              <span
                className="text-[0.56rem] shrink-0"
                style={{ color: "var(--text-muted)" }}
              >
                {parseFloat(player.selected_by_percent).toFixed(0)}%
              </span>
            )}
          </div>
        )}
      </div>
      <div
        className="min-w-[34px] text-right text-[1.25rem] leading-none"
        style={{
          fontFamily: "var(--font-display)",
          color:
            pts >= 10
              ? "var(--accent)"
              : pts <= 0
                ? "var(--danger)"
                : "var(--text-primary)",
        }}
      >
        {pts}
      </div>
    </div>
  );
}
