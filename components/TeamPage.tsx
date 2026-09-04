"use client";
import { useEffect, useMemo, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  ManagerPicks,
  LiveElement,
  LeagueMembership,
  SubPair,
  calculateLivePoints,
} from "@/lib/fpl";
import {
  allFixturesQueryOptions,
  bootstrapQueryOptions,
  classicLeagueQueryOptions,
  fixturesQueryOptions,
  liveGameweekQueryOptions,
  managerPicksQueryOptions,
  managerQueryOptions,
} from "@/lib/queries";
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

  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [rightView, setRightView] = useState<RightView>("inplay");
  const [isMobile, setIsMobile] = useState(false);

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

  // Tapping "My Team" while looking at a teammate's team should jump back to
  // your own team, not leave the viewed manager's picks showing under the
  // now-reselected tab.
  const handleBottomNavChange = (tab: MobileTab) => {
    setMobileTabState(tab);
    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", tab);
    if (tab === "team" && viewedId !== null) {
      setViewedId(null);
      p.delete("viewed");
    }
    window.history.replaceState(null, "", `${pathname}?${p.toString()}`);
  };

  const allFixturesQuery = useQuery(allFixturesQueryOptions());
  const bootstrapQuery = useQuery(bootstrapQueryOptions());
  const managerQuery = useQuery(managerQueryOptions(managerId));

  const bootstrap = bootstrapQuery.data;
  const manager = managerQuery.data ?? null;
  const allFixtures = allFixturesQuery.data ?? [];

  const currentGW = bootstrap
    ? bootstrap.events.find((e) => e.is_current)?.id ||
      bootstrap.events.find((e) => e.is_next)?.id ||
      1
    : 0;
  const activeGW = gwOverride || currentGW;

  const myLeagues: LeagueMembership[] = manager?.leagues?.classic || [];
  const leagueId =
    selectedLeagueId ??
    myLeagues.find((l) => !l.short_name)?.id ??
    myLeagues.find((l) => l.id > 1000)?.id ??
    myLeagues[0]?.id;

  const leagueQuery = useQuery(classicLeagueQueryOptions(leagueId ?? null, 1));
  const league = leagueQuery.data ?? null;

  const picksQuery = useQuery(managerPicksQueryOptions(managerId, activeGW, true));
  const liveQuery = useQuery(liveGameweekQueryOptions(activeGW));
  const fixturesQuery = useQuery(fixturesQueryOptions(activeGW));
  const picks = picksQuery.data ?? null;
  const liveData = liveQuery.data ?? null;
  const fixtures = fixturesQuery.data ?? [];

  const viewedManagerQuery = useQuery(managerQueryOptions(viewedId));
  const viewedPicksQuery = useQuery(managerPicksQueryOptions(viewedId, activeGW, false));
  const viewedManager = viewedManagerQuery.data ?? null;
  const viewedPicks = viewedPicksQuery.data ?? null;

  const entries = useMemo(() => league?.standings.results ?? [], [league]);
  // Every entry on the current page gets a live-enriched fetch so captain and
  // chip info is never silently missing for rows that are actually visible —
  // capping this at a subset (previously top 20) meant many managers in the
  // standings showed no captain and chips went uncounted.
  const enrichPicksQueries = useQueries({
    queries: entries.map((entry) => managerPicksQueryOptions(entry.entry, activeGW, true)),
  });
  // A stable string that only changes once a query actually resolves with new
  // data — the queries array itself gets a new identity every render, which
  // would either bust memoization entirely or (if left out of the deps below)
  // freeze the computed table at whatever partial data existed on the one
  // render where entries/liveData/bootstrap/fixtures last changed, silently
  // ignoring every picks fetch that resolves afterwards.
  const picksDataSignal = enrichPicksQueries.map((q) => q.dataUpdatedAt).join(",");

  const enriched: EnrichedEntry[] = useMemo(() => {
    if (!liveData || !bootstrap) return [];
    const liveMap = new Map<number, LiveElement>();
    liveData.elements.forEach((e) => liveMap.set(e.id, e));
    const playerMap = new Map(bootstrap.elements.map((p) => [p.id, p]));
    const confirmedZero = buildConfirmedZero(liveMap, playerMap, fixtures);

    return entries.map((entry, i) => {
      const p = enrichPicksQueries[i]?.data;
      if (!p) return { ...entry };
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
        captain: armbandElement ?? p.picks.find((pk) => pk.is_captain)?.element,
        entryPicks: p.picks,
        subs,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, liveData, bootstrap, fixtures, picksDataSignal]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isLoading = managerQuery.isLoading;
  const isError = managerQuery.isError;
  const isViewedLoading = viewedId !== null && viewedManager?.id !== viewedId;
  const isOwnTeamLoading = viewedId === null && picksQuery.isLoading;
  // True during a background refetch (poll or manual refresh) once we already
  // have data — distinct from the initial load, which shows the page skeleton.
  const isRefreshing = picksQuery.isFetching && !picksQuery.isLoading;

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

  if (isError || !manager)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">😅</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "2rem" }}>
          Manager Not Found
        </h2>
        <p style={{ color: "var(--text-muted)" }}>
          {isError ? "Failed to load manager data." : ""}
        </p>
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
  const enrichedLoading =
    !!league && enrichPicksQueries.length > 0 && enrichPicksQueries.every((q) => q.data === undefined);

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
    fixtures,
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
      picksQuery.refetch();
      liveQuery.refetch();
      fixturesQuery.refetch();
      enrichPicksQueries.forEach((q) => q.refetch());
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
          <BottomNav active={mobileTab} onChange={handleBottomNavChange} />
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
