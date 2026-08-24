/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Image from "next/image";
import type { Pick as FplPick, LiveElement, ManagerPicks, SubPair, Fixture } from "@/lib/fpl";
import { getPlayerPhoto, getPositionColor, getUpcomingFixture } from "@/lib/fpl";

function PitchCard({
  pick,
  playerMap,
  teamMap,
  liveMap,
  liveTotal,
  fixtures,
  activeGW,
  onPlayerClick,
  isBench,
  isSubbed,
  compact,
}: {
  pick: FplPick;
  playerMap: Map<number, any>;
  teamMap: Map<number, any>;
  liveMap: Map<number, LiveElement>;
  liveTotal?: number;
  fixtures?: Fixture[];
  activeGW?: number;
  onPlayerClick: (id: number) => void;
  isBench?: boolean;
  isSubbed?: boolean;
  compact?: boolean;
}) {
  const player = playerMap.get(pick.element);
  const live = liveMap.get(pick.element);
  const rawPts = live ? live.stats.total_points : player?.event_points || 0;
  const pts = isBench ? rawPts : live ? rawPts * pick.multiplier : rawPts;
  const posColor = player ? getPositionColor(player.element_type) : "#fff";
  const hasNotPlayed = !live || live.stats.minutes === 0;
  const upcoming =
    hasNotPlayed && player && fixtures && activeGW
      ? getUpcomingFixture(player.team, fixtures, activeGW, teamMap)
      : null;
  const contribPct =
    !isBench && liveTotal && liveTotal > 0
      ? Math.min(100, Math.max(0, Math.round((pts / liveTotal) * 100)))
      : 0;
  const photoSize = compact ? 46 : 60;
  const badgeSize = compact ? 14 : 17;

  return (
    <div
      onClick={() => onPlayerClick(pick.element)}
      className="flex flex-col items-center gap-1 cursor-pointer"
      style={{ width: compact ? 56 : 70, opacity: isBench ? 0.8 : 1 }}
    >
      <div className="relative">
        <div
          style={{
            width: photoSize,
            height: photoSize,
            borderRadius: "50%",
            overflow: "hidden",
            border: `2.5px solid ${posColor}`,
            background: "rgba(0,0,0,0.4)",
            boxShadow: `0 2px 8px rgba(0,0,0,0.5), 0 0 0 1.5px rgba(0,0,0,0.3)`,
          }}
        >
          <Image
            src={player ? getPlayerPhoto(player.code) : ""}
            alt={player?.web_name ?? ""}
            width={photoSize}
            height={photoSize}
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        {(pick.is_captain || pick.is_vice_captain) && (
          <div
            className="absolute flex items-center justify-center font-black"
            style={{
              bottom: -2,
              right: -2,
              width: badgeSize,
              height: badgeSize,
              borderRadius: "50%",
              background: pick.is_captain ? "#fbbf24" : "#3b82f6",
              fontSize: compact ? "0.42rem" : "0.5rem",
              color: pick.is_captain ? "#000" : "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
              border: "1.5px solid rgba(0,0,0,0.3)",
            }}
          >
            {pick.is_captain ? "C" : "V"}
          </div>
        )}
        {isSubbed && (
          <div
            className="absolute flex items-center justify-center font-black"
            style={{
              top: -2,
              left: -2,
              width: badgeSize,
              height: badgeSize,
              borderRadius: "50%",
              background: "#8b5cf6",
              fontSize: compact ? "0.46rem" : "0.55rem",
              color: "#fff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.6)",
              border: "1.5px solid rgba(0,0,0,0.3)",
            }}
            title="Automatic substitution"
          >
            ⇄
          </div>
        )}
      </div>

      <div
        className="flex flex-col items-center gap-px w-full"
        style={{
          background: "rgba(0,0,0,0.72)",
          borderRadius: 6,
          padding: compact ? "2px 4px" : "3px 6px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
          border: isBench
            ? "1px solid var(--border)"
            : `1px solid ${posColor}40`,
        }}
      >
        <span
          className={`font-bold truncate w-full text-center leading-tight ${compact ? "text-[0.58rem]" : "text-[0.62rem]"}`}
          style={{ color: "#fff" }}
        >
          {player?.web_name || "—"}
        </span>
        {upcoming ? (
          <span
            className={`leading-none font-bold ${compact ? "text-[0.5rem]" : "text-[0.6rem]"}`}
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            {upcoming.opponent} {upcoming.isHome ? "(H)" : "(A)"}
          </span>
        ) : (
          <span
            className={`leading-none font-bold ${compact ? "text-[0.84rem]" : "text-[0.95rem]"}`}
            style={{
              fontFamily: "var(--font-display)",
              color:
                pts >= 10 ? "var(--accent)" : pts <= 0 ? "#f87171" : "#e5e7eb",
            }}
          >
            {pts}
          </span>
        )}
        {!compact && !isBench && liveTotal && liveTotal > 0 && (
          <>
            <div
              className="w-full h-0.5 rounded-full overflow-hidden mt-px"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-400"
                style={{ background: posColor, width: `${contribPct}%` }}
              />
            </div>
            <span
              className="text-[0.5rem] leading-none"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              {contribPct}%
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default function PitchView({
  picks,
  playerMap,
  teamMap,
  liveMap,
  liveTotal,
  fixtures,
  activeGW,
  onPlayerClick,
  subs = [],
  compact,
}: {
  picks: ManagerPicks;
  playerMap: Map<number, any>;
  teamMap: Map<number, any>;
  liveMap: Map<number, LiveElement>;
  liveTotal?: number;
  fixtures?: Fixture[];
  activeGW?: number;
  onPlayerClick: (id: number) => void;
  subs?: SubPair[];
  compact?: boolean;
}) {
  const subbedElements = new Set(subs.flatMap((s) => [s.element_in, s.element_out]));
  const starting = picks.picks
    .filter((p) => p.position <= 11)
    .sort((a, b) => a.position - b.position);
  const bench = picks.picks
    .filter((p) => p.position > 11)
    .sort((a, b) => a.position - b.position);

  const byPos = new Map<number, FplPick[]>();
  for (const pick of starting) {
    const player = playerMap.get(pick.element);
    const type: number = player?.element_type ?? 4;
    if (!byPos.has(type)) byPos.set(type, []);
    byPos.get(type)!.push(pick);
  }

  const posOrder = [1, 2, 3, 4]; // FWD top → GKP bottom

  return (
    <div
      className={compact ? "p-1.5 flex-1 flex flex-col" : "p-3"}
    >
      <div
        style={{
          background:
            "repeating-linear-gradient(180deg,#1e7a33 0px,#1e7a33 48px,#1a6e2d 48px,#1a6e2d 96px)",
          borderRadius: 12,
          position: "relative",
          overflow: "hidden",
          border: "2px solid rgba(255,255,255,0.15)",
          minHeight: compact ? 340 : 460,
          flex: compact ? "1 1 auto" : undefined,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
          padding: compact ? "10px 4px" : "16px 6px",
        }}
      >
        <div
          className="absolute inset-2 rounded-md pointer-events-none"
          style={{ border: "1.5px solid rgba(255,255,255,0.22)" }}
        />
        <div
          className="absolute top-1/2 left-2 right-2 pointer-events-none"
          style={{ height: 1.5, background: "rgba(255,255,255,0.22)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full"
          style={{
            width: compact ? 44 : 70,
            height: compact ? 44 : 70,
            border: "1.5px solid rgba(255,255,255,0.22)",
          }}
        />
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: compact ? 56 : 80,
            height: compact ? 18 : 30,
            borderRadius: "0 0 50px 50px",
            border: "1.5px solid rgba(255,255,255,0.18)",
            borderTop: "none",
          }}
        />
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{
            width: compact ? 56 : 80,
            height: compact ? 18 : 30,
            borderRadius: "50px 50px 0 0",
            border: "1.5px solid rgba(255,255,255,0.18)",
            borderBottom: "none",
          }}
        />

        {posOrder.map((posType) => {
          const row = byPos.get(posType);
          if (!row || row.length === 0) return null;
          return (
            <div
              key={posType}
              className={`flex justify-center relative z-1 ${compact ? "gap-2.5 mt-1.5" : "gap-4 mt-4"}`}
            >
              {row.map((pick) => (
                <PitchCard
                  key={pick.element}
                  pick={pick}
                  playerMap={playerMap}
                  teamMap={teamMap}
                  liveMap={liveMap}
                  liveTotal={liveTotal}
                  fixtures={fixtures}
                  activeGW={activeGW}
                  onPlayerClick={onPlayerClick}
                  isSubbed={subbedElements.has(pick.element)}
                  compact={compact}
                />
              ))}
            </div>
          );
        })}
      </div>

      <div
        className={`rounded-[10px] border border-(--border) shrink-0 ${compact ? "mt-1.5 p-1.5" : "mt-2.5 p-2"}`}
        style={{ background: "var(--bg-subtle)" }}
      >
        {!compact && (
          <div
            className="text-[0.6rem] uppercase text-center font-bold mb-2 tracking-[1.5px]"
            style={{ color: "var(--text-muted)" }}
          >
            Bench
          </div>
        )}
        <div className={`flex justify-center ${compact ? "gap-2.5" : "gap-4"}`}>
          {bench.map((pick) => (
            <PitchCard
              key={pick.element}
              pick={pick}
              playerMap={playerMap}
              teamMap={teamMap}
              liveMap={liveMap}
              fixtures={fixtures}
              activeGW={activeGW}
              onPlayerClick={onPlayerClick}
              isBench
              isSubbed={subbedElements.has(pick.element)}
              compact={compact}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
