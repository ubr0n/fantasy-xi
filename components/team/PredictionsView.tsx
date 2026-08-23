/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { TrendingUp, ArrowLeftRight } from "lucide-react";
import type { ManagerPicks, Fixture } from "@/lib/fpl";
import { getPositionColor, getPositionName, formatCost } from "@/lib/fpl";
import { predictNextGwPoints, computeFixtureRun } from "@/lib/predictions";
import { suggestTransfers } from "@/lib/transferSuggestions";

function difficultyColor(d: number): string {
  if (d <= 2) return "var(--accent)";
  if (d === 3) return "var(--warning)";
  return "var(--danger)";
}

function FixtureRunDots({
  teamId,
  allFixtures,
  fromEvent,
}: {
  teamId: number;
  allFixtures: Fixture[];
  fromEvent: number;
}) {
  const run = computeFixtureRun(teamId, allFixtures, fromEvent);
  if (run.length === 0) return null;
  return (
    <div className="flex items-center gap-0.75 mt-0.75">
      {run.map((r, i) => (
        <span
          key={i}
          title={`GW${r.event}: ${r.isHome ? "H" : "A"} · difficulty ${r.difficulty}`}
          className="inline-block rounded-full"
          style={{ width: 6, height: 6, background: difficultyColor(r.difficulty) }}
        />
      ))}
    </div>
  );
}

export default function PredictionsView({
  displayPicks,
  playerMap,
  allFixtures,
  activeGW,
  onPlayerClick,
}: {
  displayPicks: ManagerPicks | null;
  playerMap: Map<number, any>;
  allFixtures: Fixture[];
  activeGW: number;
  onPlayerClick: (id: number) => void;
}) {
  if (!displayPicks) {
    return (
      <div
        className="card flex flex-col items-center justify-center p-8 text-center"
        style={{ minHeight: 180, color: "var(--text-muted)" }}
      >
        <TrendingUp size={28} className="mb-2 opacity-40" />
        <p className="text-[0.82rem]">Predictions unavailable</p>
        <p className="text-[0.7rem] mt-1 opacity-60">Team picks haven&apos;t loaded yet</p>
      </div>
    );
  }

  const fromEvent = activeGW + 1;

  const predicted = displayPicks.picks
    .map((pick) => {
      const player = playerMap.get(pick.element);
      if (!player) return null;
      return { pick, player, prediction: predictNextGwPoints(player) };
    })
    .filter((p): p is { pick: (typeof displayPicks.picks)[number]; player: any; prediction: ReturnType<typeof predictNextGwPoints> } => p !== null)
    .sort((a, b) => b.prediction.predicted - a.prediction.predicted);

  const suggestions = suggestTransfers({
    picks: displayPicks.picks,
    bank: displayPicks.entry_history.bank,
    playerMap,
    allFixtures,
    fromEvent,
  });

  return (
    <div className="flex flex-col gap-2.5">
      <div className="card overflow-hidden">
        <div className="px-[0.9rem] py-[0.6rem] border-b border-(--border)">
          <span className="font-bold text-[0.78rem]">Predicted Points — Next GW</span>
        </div>
        <div>
          {predicted.map(({ pick, player, prediction }) => (
            <div
              key={pick.element}
              className="row-item flex items-center gap-2 px-[0.9rem] py-[0.48rem] cursor-pointer"
              onClick={() => onPlayerClick(pick.element)}
            >
              <span
                className="badge min-w-8 justify-center text-[0.6rem]"
                style={{
                  background: getPositionColor(player.element_type) + "20",
                  color: getPositionColor(player.element_type),
                }}
              >
                {getPositionName(player.element_type)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[0.8rem] truncate">{player.web_name}</div>
                <FixtureRunDots teamId={player.team} allFixtures={allFixtures} fromEvent={fromEvent} />
              </div>
              <div
                className="text-right shrink-0 text-[1.1rem]"
                style={{
                  fontFamily: "var(--font-display)",
                  color: prediction.predicted >= 6 ? "var(--accent)" : "var(--text-primary)",
                }}
              >
                {prediction.predicted}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-[0.9rem] py-[0.6rem] border-b border-(--border)">
          <span className="font-bold text-[0.78rem]">Transfer Suggestions</span>
          <p className="text-[0.62rem] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Budget is approximate (uses current price, not exact sell price) · free transfers not modeled
          </p>
        </div>
        <div>
          {suggestions.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center p-8 text-center"
              style={{ minHeight: 140, color: "var(--text-muted)" }}
            >
              <ArrowLeftRight size={26} className="mb-2 opacity-40" />
              <p className="text-[0.82rem]">Squad looks solid</p>
              <p className="text-[0.7rem] mt-1 opacity-60">No changes to suggest right now</p>
            </div>
          ) : (
            suggestions.map((s) => {
              const outPlayer = playerMap.get(s.out.element);
              return (
                <div
                  key={s.out.element}
                  className="px-[0.9rem] py-[0.6rem] border-b border-(--border) last:border-b-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="badge badge-red text-[0.68rem] cursor-pointer"
                      onClick={() => onPlayerClick(s.out.element)}
                    >
                      OUT: {outPlayer?.web_name}
                    </span>
                    <span className="text-[0.65rem]" style={{ color: "var(--text-muted)" }}>
                      {formatCost(outPlayer?.now_cost ?? 0)}
                    </span>
                  </div>
                  {s.out.reasons.length > 0 && (
                    <p className="text-[0.68rem] mb-1.5" style={{ color: "var(--text-muted)" }}>
                      {s.out.reasons.join(" · ")}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {s.in.map((c) => {
                      const inPlayer = playerMap.get(c.element);
                      return (
                        <span
                          key={c.element}
                          className="badge badge-green text-[0.68rem] cursor-pointer"
                          onClick={() => onPlayerClick(c.element)}
                          title={c.reasons.join(" · ")}
                        >
                          IN: {inPlayer?.web_name} · {formatCost(c.cost)} · {c.predicted}pts
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
