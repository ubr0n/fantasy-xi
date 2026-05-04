/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  fetchManager,
  fetchManagerPicks,
  fetchLiveGameweek,
  fetchBootstrap,
  fetchClassicLeague,
  BootstrapStatic,
  ManagerInfo,
  ManagerPicks,
  LiveGameweek,
  LiveElement,
  ClassicLeague,
  LeagueMembership,
  calculateLivePoints,
} from "@/lib/fpl";
import { CardSkeleton, TableRowSkeleton } from "@/components/Skeleton";
import LeaguePanel from "./team/LeaguePanel";
import TeamPanel from "./team/TeamPanel";
import StatsPanel, { InPlayView } from "./team/StatsPanel";
import PlayerModal from "./team/PlayerModal";
import BottomNav from "./team/BottomNav";
import {
  EnrichedEntry,
  MobileTab,
  RightView,
  calcScore,
} from "./team/types";

interface Props {
  managerId: number;
}

export default function TeamPage({ managerId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const gwParam = searchParams.get("gw");
  const leagueParam = searchParams.get("league");

  const [bootstrap, setBootstrap] = useState<BootstrapStatic | null>(null);
  const [manager, setManager] = useState<ManagerInfo | null>(null);
  const [picks, setPicks] = useState<ManagerPicks | null>(null);
  const [liveData, setLiveData] = useState<LiveGameweek | null>(null);
  const [league, setLeague] = useState<ClassicLeague | null>(null);
  const [enriched, setEnriched] = useState<EnrichedEntry[]>([]);
  const [viewedId, setViewedId] = useState<number | null>(null);
  const [viewedManager, setViewedManager] = useState<ManagerInfo | null>(null);
  const [viewedPicks, setViewedPicks] = useState<ManagerPicks | null>(null);
  const [currentGW, setCurrentGW] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("team");
  const [rightView, setRightView] = useState<RightView>("inplay");
  const [isMobile, setIsMobile] = useState(false);

  const myLeagues: LeagueMembership[] = manager?.leagues?.classic || [];
  const leagueId = leagueParam
    ? parseInt(leagueParam)
    : (myLeagues.find((l) => !l.short_name)?.id ??
      myLeagues.find((l) => l.id > 1000)?.id ??
      myLeagues[0]?.id);

  const activeGW = (gwParam ? parseInt(gwParam) : null) || currentGW;
  const isLoading = !manager && !error;
  const isViewedLoading = viewedId !== null && viewedManager?.id !== viewedId;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    Promise.all([fetchBootstrap(), fetchManager(managerId)])
      .then(([bs, mgr]) => {
        const gw =
          bs.events.find((e) => e.is_current)?.id ||
          bs.events.find((e) => e.is_next)?.id ||
          1;
        setBootstrap(bs);
        setManager(mgr);
        setCurrentGW(gw);
      })
      .catch(() => setError("Failed to load manager data."));
  }, [managerId]);

  useEffect(() => {
    if (!leagueId) return;
    fetchClassicLeague(leagueId)
      .then(setLeague)
      .catch(() => {});
  }, [leagueId]);

  useEffect(() => {
    if (!activeGW) return;
    Promise.all([
      fetchManagerPicks(managerId, activeGW),
      fetchLiveGameweek(activeGW),
    ])
      .then(([p, live]) => {
        setPicks(p);
        setLiveData(live);
        setIsRefreshing(false);
      })
      .catch(() => setIsRefreshing(false));
  }, [activeGW, managerId, refreshKey]);

  useEffect(() => {
    if (!activeGW) return;
    const id = setInterval(() => setRefreshKey((k) => k + 1), 90000);
    return () => clearInterval(id);
  }, [activeGW]);

  useEffect(() => {
    if (!league || !liveData) return;
    const liveMap = new Map<number, LiveElement>();
    liveData.elements.forEach((e) => liveMap.set(e.id, e));
    Promise.all(
      league.standings.results.map(async (entry) => {
        try {
          const p = await fetchManagerPicks(entry.entry, activeGW);
          return {
            ...entry,
            livePoints: calculateLivePoints(p.picks, liveMap).total,
            chipActive: p.active_chip,
            captain: p.picks.find((pk) => pk.is_captain)?.element,
            entryPicks: p.picks,
          };
        } catch {
          return { ...entry };
        }
      }),
    ).then(setEnriched);
  }, [league, liveData, activeGW]);

  useEffect(() => {
    if (viewedId === null) return;
    Promise.all([fetchManager(viewedId), fetchManagerPicks(viewedId, activeGW)])
      .then(([mgr, p]) => {
        setViewedManager(mgr);
        setViewedPicks(p);
      })
      .catch(() => {});
  }, [viewedId, activeGW]);

  if (isLoading)
    return (
      <div
        className="min-h-screen pt-20 px-6 pb-8"
        style={{ maxWidth: 960, margin: "0 auto" }}
      >
        <div
          className="grid gap-4 mb-6"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}
        >
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <TableRowSkeleton key={i} />
        ))}

      </div>
    );

  if (error || !manager)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">😅</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem" }}>
          Manager Not Found
        </h2>
        <p style={{ color: "var(--text-muted)" }}>{error}</p>
        <Link href="/">
          <button className="btn-primary">← Back to Search</button>
        </Link>
      </div>
    );

  const liveMap = new Map<number, LiveElement>();
  liveData?.elements.forEach((e) => liveMap.set(e.id, e));
  const { total: liveTotal, bench: liveBench } = picks
    ? calcScore(picks.picks, liveMap)
    : { total: 0, bench: 0 };
  const playerMap = new Map(bootstrap?.elements.map((p) => [p.id, p]));
  const teamMap = new Map(bootstrap?.teams.map((t) => [t.id, t]));
  const gwEvents = bootstrap?.events || [];
  const maxGW = gwEvents.filter((e) => e.finished || e.is_current).length;

  const displayManager = viewedId !== null ? viewedManager : manager;
  const displayPicks = viewedId !== null ? viewedPicks : picks;
  const displayScore =
    viewedId !== null
      ? viewedPicks
        ? calcScore(viewedPicks.picks, liveMap)
        : { total: 0, bench: 0 }
      : { total: liveTotal, bench: liveBench };

  const setGW = (gw: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("gw", String(gw));
    router.replace(`${pathname}?${p.toString()}`);
  };

  const changeLeague = (id: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("league", String(id));
    router.replace(`${pathname}?${p.toString()}`);
    setLeague(null);
    setEnriched([]);
  };

  const handleManagerClick = (entryId: number) => {
    setViewedId(entryId === managerId ? null : entryId);
    if (isMobile) setMobileTab("team");
  };

  const leaguePanelProps = {
    league,
    enriched,
    currentGW: activeGW,
    managerId,
    viewedId,
    onManagerClick: handleManagerClick,
    leagues: myLeagues,
    leagueId: leagueId ?? null,
    onLeagueChange: changeLeague,
    playerMap,
  };

  const teamPanelProps = {
    manager: displayManager,
    myManager: manager,
    picks: displayPicks,
    liveMap,
    playerMap,
    teamMap,
    loading: isRefreshing || isViewedLoading,
    liveTotal: displayScore.total,
    liveBench: displayScore.bench,
    activeGW,
    maxGW,
    gwEvents,
    onGWChange: setGW,
    onPlayerClick: setSelectedPlayer,
    isViewing: viewedId !== null,
    onBack: () => setViewedId(null),
    isMobile,
    onRefresh: () => {
      setIsRefreshing(true);
      setRefreshKey((k) => k + 1);
    },
  };

  const statsPanelProps = {
    view: rightView,
    onViewChange: setRightView,
    picks,
    liveMap,
    playerMap,
    teamMap,
    enriched,
    onPlayerClick: setSelectedPlayer,
  };

  return (
    <>
      {isMobile ? (
        <div className="min-h-screen pb-18">
          <div className="pt-18 px-3 pb-4">
            {mobileTab === "league" && <LeaguePanel {...leaguePanelProps} />}
            {mobileTab === "team" && <TeamPanel {...teamPanelProps} />}
            {mobileTab === "live" && (
              <InPlayView
                picks={picks}
                liveMap={liveMap}
                playerMap={playerMap}
                teamMap={teamMap}
                onPlayerClick={setSelectedPlayer}
              />
            )}
            {mobileTab === "stats" && <StatsPanel {...statsPanelProps} />}
          </div>
          <BottomNav active={mobileTab} onChange={setMobileTab} />
        </div>
      ) : (
        <div
          className="min-h-screen pt-20 px-4 pb-8 grid items-start gap-3"
          style={{
            gridTemplateColumns: "400px 1fr 260px",
            maxWidth: 1420,
            margin: "0 auto",
          }}
        >
          <div className="flex flex-col gap-2.5 sticky top-20 h-[calc(100vh-6rem)]">
            <Link href="/" style={{ textDecoration: "none" }}>
              <button className="btn-ghost flex items-center justify-center gap-1.5 w-full text-[0.82rem]">
                <ArrowLeft size={13} /> Back to Search
              </button>
            </Link>
            <LeaguePanel {...leaguePanelProps} />
          </div>
          <TeamPanel {...teamPanelProps} />
          <StatsPanel {...statsPanelProps} />
        </div>
      )}

      {selectedPlayer !== null && (
        <PlayerModal
          playerId={selectedPlayer}
          playerMap={playerMap}
          teamMap={teamMap}
          liveMap={liveMap}
          enriched={enriched}
          picks={picks}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </>
  );
}
