/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  fetchManager,
  fetchManagerPicks,
  fetchLiveGameweek,
  fetchBootstrap,
  fetchClassicLeague,
  fetchFixtures,
  fetchAllFixtures,
  BootstrapStatic,
  ManagerInfo,
  ManagerPicks,
  LiveGameweek,
  LiveElement,
  ClassicLeague,
  LeagueMembership,
  Fixture,
  SubPair,
  calculateLivePoints,
} from "@/lib/fpl";
import { buildConfirmedZero, computeArmbandElement, computeProvisionalAutoSubs } from "@/lib/autoSubs";
import { CardSkeleton, TableRowSkeleton } from "@/components/Skeleton";
import LeaguePanel from "./team/LeaguePanel";
import TeamPanel from "./team/TeamPanel";
import StatsPanel, { InPlayView } from "./team/StatsPanel";
import PlayerModal from "./team/PlayerModal";
import BottomNav from "./team/BottomNav";
import { EnrichedEntry, MobileTab, RightView, calcScore } from "./team/types";

interface Props {
  managerId: number;
}

export default function TeamPage({ managerId }: Props) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const gwParam = searchParams.get("gw");
  const leagueParam = searchParams.get("league");

  const [bootstrap, setBootstrap] = useState<BootstrapStatic | null>(null);
  const [manager, setManager] = useState<ManagerInfo | null>(null);
  const [picks, setPicks] = useState<ManagerPicks | null>(null);
  const [liveData, setLiveData] = useState<LiveGameweek | null>(null);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [allFixtures, setAllFixtures] = useState<Fixture[]>([]);
  const [league, setLeague] = useState<ClassicLeague | null>(null);
  const [enriched, setEnriched] = useState<EnrichedEntry[]>([]);
  const [viewedManager, setViewedManager] = useState<ManagerInfo | null>(null);
  const [viewedPicks, setViewedPicks] = useState<ManagerPicks | null>(null);
  const [currentGW, setCurrentGW] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pickAttempted, setPickAttempted] = useState(false);
  const [error, setError] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [rightView, setRightView] = useState<RightView>("inplay");
  const [isMobile, setIsMobile] = useState(false);

  // Discard a poll's response if a newer poll has since been kicked off — a
  // slow response landing after a fresher one would otherwise overwrite
  // current totals/subs with stale data.
  const picksRequestId = useRef(0);
  const leagueRequestId = useRef(0);
  const viewedRequestId = useRef(0);

  // These mirror URL query params but live in local state and are synced back
  // to the URL bar with history.replaceState instead of router.replace. Every
  // one of these changes on a tap (tab, GW, league, viewed manager), and
  // router.replace forces a full server round-trip to re-render the page's
  // Server Component (it does an external fetch) — that's what made tab
  // switches, GW navigation, the league dropdown, and viewing a teammate all
  // feel laggy.
  const [mobileTab, setMobileTabState] = useState<MobileTab>(
    () => (searchParams.get("tab") as MobileTab) || "team",
  );
  const [gwOverride, setGwOverride] = useState<number | null>(() =>
    gwParam ? parseInt(gwParam) : null,
  );
  const [selectedLeagueId, setSelectedLeagueId] = useState<number | null>(() =>
    leagueParam ? parseInt(leagueParam) : null,
  );
  const [viewedId, setViewedId] = useState<number | null>(() =>
    searchParams.get("viewed") ? parseInt(searchParams.get("viewed")!) : null,
  );

  const setMobileTab = (tab: MobileTab) => {
    setMobileTabState(tab);
    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", tab);
    window.history.replaceState(null, "", `${pathname}?${p.toString()}`);
  };

  const myLeagues: LeagueMembership[] = manager?.leagues?.classic || [];
  const leagueId =
    selectedLeagueId ??
    myLeagues.find((l) => !l.short_name)?.id ??
    myLeagues.find((l) => l.id > 1000)?.id ??
    myLeagues[0]?.id;

  const activeGW = gwOverride || currentGW;
  const isLoading = !manager && !error;
  const isViewedLoading = viewedId !== null && viewedManager?.id !== viewedId;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    fetchAllFixtures()
      .then(setAllFixtures)
      .catch(() => {});
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
    const requestId = ++picksRequestId.current;
    Promise.all([
      fetchManagerPicks(managerId, activeGW),
      fetchLiveGameweek(activeGW),
      fetchFixtures(activeGW),
    ])
      .then(([p, live, fx]) => {
        if (requestId !== picksRequestId.current) return;
        setPicks(p);
        setLiveData(live);
        setFixtures(fx);
        setIsRefreshing(false);
        setPickAttempted(true);
      })
      .catch(() => {
        if (requestId === picksRequestId.current) {
          setIsRefreshing(false);
          setPickAttempted(true);
        }
      });
  }, [activeGW, managerId, refreshKey]);

  useEffect(() => {
    if (!activeGW) return;
    const id = setInterval(() => setRefreshKey((k) => k + 1), 90000);
    return () => clearInterval(id);
  }, [activeGW]);

  useEffect(() => {
    if (!league || !liveData || !bootstrap) return;
    const requestId = ++leagueRequestId.current;
    const liveMap = new Map<number, LiveElement>();
    liveData.elements.forEach((e) => liveMap.set(e.id, e));
    const playerMap = new Map(bootstrap.elements.map((p) => [p.id, p]));
    const confirmedZero = buildConfirmedZero(liveMap, playerMap, fixtures);
    Promise.all(
      league.standings.results.map(async (entry, i) => {
        if (i >= 20) return { ...entry };
        try {
          const p = await fetchManagerPicks(entry.entry, activeGW);
          const subs =
            p.automatic_subs.length > 0
              ? p.automatic_subs
              : computeProvisionalAutoSubs(p.picks, playerMap, confirmedZero);
          const armbandElement = computeArmbandElement(p.picks, confirmedZero);
          return {
            ...entry,
            livePoints: calculateLivePoints(
              p.picks,
              liveMap,
              p.active_chip,
              subs,
              armbandElement,
            ).total,
            chipActive: p.active_chip,
            captain: p.picks.find((pk) => pk.is_captain)?.element,
            entryPicks: p.picks,
          };
        } catch {
          return { ...entry };
        }
      }),
    ).then((results) => {
      if (requestId === leagueRequestId.current) setEnriched(results);
    });
  }, [league, liveData, activeGW, bootstrap, fixtures]);

  useEffect(() => {
    if (viewedId === null) return;
    const requestId = ++viewedRequestId.current;
    Promise.all([fetchManager(viewedId), fetchManagerPicks(viewedId, activeGW)])
      .then(([mgr, p]) => {
        if (requestId !== viewedRequestId.current) return;
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
  const playerMap = new Map(bootstrap?.elements.map((p) => [p.id, p]));
  const teamMap = new Map(bootstrap?.teams.map((t) => [t.id, t]));
  const gwEvents = bootstrap?.events || [];
  const maxGW = gwEvents.filter((e) => e.finished || e.is_current).length;

  const confirmedZero = buildConfirmedZero(liveMap, playerMap, fixtures);
  const subsFor = (p: ManagerPicks | null) => {
    if (!p) return { subs: [] as SubPair[], armbandElement: null as number | null };
    const subs =
      p.automatic_subs.length > 0
        ? p.automatic_subs
        : computeProvisionalAutoSubs(p.picks, playerMap, confirmedZero);
    const armbandElement = computeArmbandElement(p.picks, confirmedZero);
    return { subs, armbandElement };
  };
  const scoreFor = (p: ManagerPicks | null) => {
    if (!p) return { total: 0, bench: 0 };
    const { subs, armbandElement } = subsFor(p);
    return calcScore(p.picks, liveMap, p.active_chip, subs, armbandElement);
  };

  const { total: liveTotal, bench: liveBench } = scoreFor(picks);
  const liveLoading = !liveData;
  const enrichedLoading = !!league && enriched.length === 0;
  const isOwnTeamLoading = viewedId === null && !pickAttempted;

  const displayManager = viewedId !== null ? viewedManager : manager;
  const displayPicks = viewedId !== null ? viewedPicks : picks;
  const displayScore =
    viewedId !== null ? scoreFor(viewedPicks) : { total: liveTotal, bench: liveBench };
  const { subs: displaySubs, armbandElement: displayArmband } = subsFor(displayPicks);

  const setGW = (gw: number) => {
    setGwOverride(gw);
    const p = new URLSearchParams(searchParams.toString());
    p.set("gw", String(gw));
    window.history.replaceState(null, "", `${pathname}?${p.toString()}`);
  };

  const changeLeague = (id: number) => {
    setSelectedLeagueId(id);
    const p = new URLSearchParams(searchParams.toString());
    p.set("league", String(id));
    window.history.replaceState(null, "", `${pathname}?${p.toString()}`);
    setLeague(null);
    setEnriched([]);
  };

  const handleManagerClick = (entryId: number) => {
    const nextViewed = entryId === managerId ? null : entryId;
    setViewedId(nextViewed);
    if (isMobile) setMobileTabState("team");
    const p = new URLSearchParams(searchParams.toString());
    if (nextViewed === null) {
      p.delete("viewed");
    } else {
      p.set("viewed", String(nextViewed));
    }
    if (isMobile) p.set("tab", "team");
    window.history.replaceState(null, "", `${pathname}?${p.toString()}`);
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
    loading: isRefreshing || isViewedLoading || isOwnTeamLoading,
    liveTotal: displayScore.total,
    liveBench: displayScore.bench,
    subs: displaySubs,
    armbandElement: displayArmband,
    allFixtures,
    fixtures,
    activeGW,
    maxGW,
    gwEvents,
    onGWChange: setGW,
    onPlayerClick: setSelectedPlayer,
    isViewing: viewedId !== null,
    onBack: () => {
      setViewedId(null);
      const p = new URLSearchParams(searchParams.toString());
      p.delete("viewed");
      window.history.replaceState(null, "", `${pathname}?${p.toString()}`);
    },
    isMobile,
    onRefresh: () => {
      setIsRefreshing(true);
      setRefreshKey((k) => k + 1);
    },
    onGoToLeague: () => setMobileTab("league"),
  };

  const statsPanelProps = {
    view: rightView,
    onViewChange: setRightView,
    picks,
    liveData,
    liveMap,
    playerMap,
    teamMap,
    enriched,
    liveLoading,
    enrichedLoading,
    onPlayerClick: setSelectedPlayer,
  };

  return (
    <>
      {isMobile ? (
        <div className="min-h-screen pb-24">
          <div className="pt-18 px-3 pb-4">
            {mobileTab === "league" && <LeaguePanel {...leaguePanelProps} />}
            {mobileTab === "team" && <TeamPanel {...teamPanelProps} />}
            {mobileTab === "live" && (
              <InPlayView
                picks={picks}
                liveMap={liveMap}
                playerMap={playerMap}
                teamMap={teamMap}
                loading={liveLoading}
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
