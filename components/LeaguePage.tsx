"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
} from "lucide-react";
import {
  fetchClassicLeague,
  fetchLiveGameweek,
  fetchBootstrap,
  fetchManagerPicks,
  ClassicLeague,
  LeagueEntry,
  LiveElement,
  BootstrapStatic,
  calculateLivePoints,
} from "@/lib/fpl";
import { Skeleton, TableRowSkeleton } from "@/components/Skeleton";

interface Props {
  leagueId: number;
}

type SortKey = "rank" | "total" | "event_total" | "live" | "rank_change";

interface EnrichedEntry extends LeagueEntry {
  livePoints?: number;
  chipActive?: string | null;
  captain?: number;
}

const CHIP_LABELS: Record<string, string> = {
  wildcard: "🔄 WC",
  freehit: "🆓 FH",
  bboost: "📈 BB",
  "3xc": "3️⃣ TC",
};

const GRID = "40px 1fr 80px 80px 80px 60px";

export default function LeaguePage({ leagueId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [league, setLeague] = useState<ClassicLeague | null>(null);
  const [bootstrap, setBootstrap] = useState<BootstrapStatic | null>(null);
  const [enriched, setEnriched] = useState<EnrichedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveLoading, setLiveLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentGW, setCurrentGW] = useState(1);
  const [page, setPage] = useState(1);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const sortParam = (searchParams.get("sort") as SortKey) || "rank";
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const setSort = (k: SortKey) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("sort", k);
    router.replace(`${pathname}?${p.toString()}`);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([fetchBootstrap(), fetchClassicLeague(leagueId, page)])
      .then(([bs, lg]) => {
        setBootstrap(bs);
        setLeague(lg);
        const gw =
          bs.events.find((e) => e.is_current)?.id ||
          bs.events.find((e) => e.is_next)?.id ||
          1;
        setCurrentGW(gw);
      })
      .catch(() => setError("Failed to load league"))
      .finally(() => setLoading(false));
  }, [leagueId, page]);

  const loadLive = useCallback(async () => {
    if (!currentGW || !league) return;
    setLiveLoading(true);
    try {
      const live = await fetchLiveGameweek(currentGW);
      setLastRefresh(new Date());

      const entries = league.standings.results;
      const liveMap = new Map<number, LiveElement>();
      live.elements.forEach((e) => liveMap.set(e.id, e));

      const enrichPromises = entries.slice(0, 20).map(async (entry) => {
        try {
          const picks = await fetchManagerPicks(entry.entry, currentGW);
          const liveScore = calculateLivePoints(picks.picks, liveMap);
          const captain = picks.picks.find((p) => p.is_captain)?.element;
          return {
            ...entry,
            livePoints: liveScore.total,
            chipActive: picks.active_chip,
            captain,
          };
        } catch {
          return { ...entry, livePoints: entry.event_total };
        }
      });

      const enriched = await Promise.all(enrichPromises);
      setEnriched(enriched);
    } catch {
      // live data may not be available
    } finally {
      setLiveLoading(false);
    }
  }, [currentGW, league]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (league && currentGW) loadLive();
  }, [league, currentGW, loadLive]);

  useEffect(() => {
    intervalRef.current = setInterval(loadLive, 90000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadLive]);

  if (loading) {
    return (
      <div
        className="min-h-screen pt-20 px-6 pb-8"
        style={{ maxWidth: 960, margin: "0 auto" }}
      >
        <Skeleton height={60} style={{ marginBottom: 20 }} />
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <TableRowSkeleton key={i} cols={6} />
        ))}
      </div>
    );
  }

  if (error || !league) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem" }}>
          League Not Found
        </h2>
        <p style={{ color: "var(--text-muted)" }}>{error}</p>
        <Link href="/">
          <button className="btn-primary">← Back</button>
        </Link>
      </div>
    );
  }

  const rawEntries = league.standings.results;
  const displayEntries: EnrichedEntry[] =
    enriched.length > 0 ? enriched : rawEntries.map((e) => ({ ...e }));

  const playerMap = new Map(bootstrap?.elements.map((p) => [p.id, p]));

  const sorted = [...displayEntries].sort((a, b) => {
    switch (sortParam) {
      case "total":
        return b.total - a.total;
      case "event_total":
        return b.event_total - a.event_total;
      case "live":
        return (
          (b.livePoints ?? b.event_total) - (a.livePoints ?? a.event_total)
        );
      case "rank_change":
        return a.last_rank - a.rank - (b.last_rank - b.rank);
      default:
        return a.rank - b.rank;
    }
  });

  const sortBtn = (key: SortKey, label: string) => (
    <button
      onClick={() => setSort(key)}
      className="rounded-lg border-0 cursor-pointer font-semibold text-[0.75rem] transition-all duration-150 px-[0.8rem] py-[0.4rem]"
      style={{
        background: sortParam === key ? "var(--accent)" : "var(--bg-subtle)",
        color: sortParam === key ? "#000" : "var(--text-secondary)",
      }}
    >
      {label}
    </button>
  );

  const gwEvent = bootstrap?.events.find((e) => e.id === currentGW);

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ maxWidth: 1000, margin: "0 auto" }}
    >
      {/* Fixed header area */}
      <div className="shrink-0 pt-20 px-6">
        {/* Back / refresh */}
        <div className="flex items-center justify-between mb-5">
          <Link href="/" style={{ textDecoration: "none" }}>
            <button className="btn-ghost flex items-center gap-1.5">
              <ArrowLeft size={14} /> Back
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[0.75rem]" style={{ color: "var(--text-muted)" }}>
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
            <button
              className="btn-ghost flex items-center gap-1.5"
              onClick={loadLive}
              disabled={liveLoading}
            >
              <RefreshCw
                size={13}
                className={liveLoading ? "animate-spin-custom" : ""}
              />{" "}
              Refresh
            </button>
          </div>
        </div>

        {/* League header card */}
        <div
          className="card animate-fade-in-up relative overflow-hidden mb-4 px-7 py-5"
        >
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-glow) 0%, transparent 60%)",
            }}
          />
          <div className="relative flex flex-wrap justify-between items-center gap-3">
            <div>
              <p
                className="text-[0.7rem] uppercase tracking-widest mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                Classic League
              </p>
              <h1
                className="leading-none"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(1.3rem, 4vw, 2rem)",
                  letterSpacing: 1,
                }}
              >
                {league.league.name}
              </h1>
            </div>
            <div className="flex gap-4">
              {[
                { val: displayEntries.length, label: "Managers", accent: true },
                gwEvent
                  ? { val: `GW${currentGW}`, label: gwEvent.finished ? "Finished" : gwEvent.is_current ? "Live" : "Upcoming" }
                  : null,
                gwEvent?.average_entry_score != null
                  ? { val: gwEvent.average_entry_score, label: "GW Avg" }
                  : null,
              ]
                .filter(Boolean)
                .map((s, i) => (
                  <div key={i} className="text-center">
                    <div
                      className="text-[1.6rem]"
                      style={{
                        fontFamily: "var(--font-display)",
                        color: i === 0 ? "var(--accent)" : undefined,
                      }}
                    >
                      {s!.val}
                    </div>
                    <div
                      className="text-[0.62rem] uppercase tracking-widest"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {s!.label}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Sort controls */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="text-[0.75rem] mr-1" style={{ color: "var(--text-muted)" }}>
            Sort by:
          </span>
          {sortBtn("rank", "📍 Rank")}
          {sortBtn("live", "⚡ Live")}
          {sortBtn("event_total", "📅 GW Pts")}
          {sortBtn("total", "🏆 Total")}
          {sortBtn("rank_change", "📈 Movement")}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 px-6 pb-6 flex flex-col">
        <div
          className="card animate-scale-in flex-1 min-h-0 flex flex-col overflow-hidden"
        >
          {/* Column headers */}
          <div
            className="shrink-0 grid gap-2 px-4 py-[0.6rem] border-b border-(--border) text-[0.68rem] font-bold uppercase tracking-widest"
            style={{
              gridTemplateColumns: GRID,
              background: "var(--bg-subtle)",
              color: "var(--text-muted)",
            }}
          >
            <span>#</span>
            <span>Manager / Team</span>
            <span className="text-right">GW</span>
            <span className="text-right hide-sm">Live</span>
            <span className="text-right">Total</span>
            <span className="text-right hide-sm">Chip</span>
          </div>

          {/* Rows */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {sorted.map((entry, idx) => {
              const change = entry.last_rank - entry.rank;
              const liveScore = entry.livePoints ?? entry.event_total;
              const captain = entry.captain
                ? playerMap.get(entry.captain)
                : null;

              return (
                <div
                  key={entry.id}
                  className="row-item grid gap-2 px-4 py-3 items-center cursor-pointer"
                  style={{
                    gridTemplateColumns: GRID,
                    background:
                      idx === 0
                        ? "linear-gradient(90deg,rgba(0,214,143,0.05) 0%,transparent 100%)"
                        : undefined,
                  }}
                  onClick={() =>
                    router.push(`/team/${entry.entry}?gw=${currentGW}`)
                  }
                >
                  <div className="flex items-center gap-[3px]">
                    <span
                      className="font-bold text-[0.85rem]"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color:
                          idx < 3 ? "var(--accent)" : "var(--text-primary)",
                      }}
                    >
                      {idx + 1 === 1
                        ? "🥇"
                        : idx + 1 === 2
                          ? "🥈"
                          : idx + 1 === 3
                            ? "🥉"
                            : entry.rank}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-[0.875rem]">
                      {entry.player_name}
                      <span
                        className="flex items-center gap-0.5 text-[0.7rem]"
                        style={{
                          color:
                            change > 0
                              ? "var(--accent)"
                              : change < 0
                                ? "var(--danger)"
                                : "var(--text-muted)",
                        }}
                      >
                        {change > 0 ? (
                          <TrendingUp size={10} />
                        ) : change < 0 ? (
                          <TrendingDown size={10} />
                        ) : (
                          <Minus size={10} />
                        )}
                        {change !== 0 && Math.abs(change)}
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-1.5 text-[0.72rem]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {entry.entry_name}
                      {captain && (
                        <span style={{ color: "var(--warning)" }}>
                          ⭐ {captain.web_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className="text-right text-[1.1rem]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {entry.event_total}
                  </div>

                  <div
                    className="hide-sm text-right text-[1.1rem]"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--accent)",
                    }}
                  >
                    {liveScore}
                  </div>

                  <div className="text-right font-semibold text-[0.9rem]">
                    {entry.total}
                  </div>

                  <div className="hide-sm text-right">
                    {entry.chipActive && (
                      <span
                        className="badge badge-purple text-[0.6rem]"
                      >
                        {CHIP_LABELS[entry.chipActive] || entry.chipActive}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {(league.standings.has_next || page > 1) && (
            <div className="shrink-0 flex justify-center gap-2 px-4 py-3 border-t border-(--border)">
              {page > 1 && (
                <button
                  className="btn-ghost"
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Previous
                </button>
              )}
              {league.standings.has_next && (
                <button
                  className="btn-ghost"
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              )}
            </div>
          )}

          {/* Active chips summary */}
          {enriched.length > 0 && enriched.some((e) => e.chipActive) && (
            <div
              className="shrink-0 flex flex-wrap items-center gap-1.5 px-4 py-[0.65rem] border-t border-(--border)"
              style={{ background: "var(--bg-subtle)" }}
            >
              <span
                className="flex items-center gap-[5px] text-[0.68rem] font-bold mr-1"
                style={{ color: "var(--text-muted)" }}
              >
                <Award size={12} style={{ color: "var(--accent)" }} /> Active
                Chips
              </span>
              {enriched
                .filter((e) => e.chipActive)
                .map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-[5px] rounded-[6px] text-[0.72rem] px-2 py-[2px] border border-(--border)"
                    style={{ background: "var(--bg-card)" }}
                  >
                    <span className="font-semibold">{e.player_name}</span>
                    <span className="badge badge-purple text-[0.58rem]">
                      {CHIP_LABELS[e.chipActive!] || e.chipActive}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
