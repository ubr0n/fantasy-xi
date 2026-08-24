import { queryOptions } from "@tanstack/react-query";
import {
  fetchBootstrap,
  fetchManager,
  fetchManagerPicks,
  fetchLiveGameweek,
  fetchFixtures,
  fetchAllFixtures,
  fetchClassicLeague,
} from "./fpl";

// Query keys are shared across pages on purpose — a manager's picks for a given
// gameweek are the same data whether they're fetched for the league standings
// table, the "viewed" team panel, or the owner's own team, so identical keys
// let React Query dedupe concurrent requests and reuse the cache across
// navigations instead of refetching.
export const queryKeys = {
  bootstrap: ["bootstrap"] as const,
  manager: (id: number) => ["manager", id] as const,
  managerPicks: (id: number, gw: number) => ["managerPicks", id, gw] as const,
  liveGameweek: (gw: number) => ["liveGameweek", gw] as const,
  fixtures: (gw: number) => ["fixtures", gw] as const,
  allFixtures: ["fixtures", "all"] as const,
  classicLeague: (id: number, page: number) => ["classicLeague", id, page] as const,
};

export const bootstrapQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.bootstrap,
    queryFn: fetchBootstrap,
    staleTime: 5 * 60_000,
  });

export const managerQueryOptions = (id: number | null) =>
  queryOptions({
    queryKey: queryKeys.manager(id ?? 0),
    queryFn: () => fetchManager(id as number),
    enabled: id !== null,
  });

/** `live` adds a 90s refetch interval — use it for anything shown as part of a live gameweek view. */
export const managerPicksQueryOptions = (id: number | null, gw: number, live = false) =>
  queryOptions({
    queryKey: queryKeys.managerPicks(id ?? 0, gw),
    queryFn: () => fetchManagerPicks(id as number, gw),
    enabled: id !== null && !!gw,
    refetchInterval: live ? 90_000 : false,
  });

export const liveGameweekQueryOptions = (gw: number) =>
  queryOptions({
    queryKey: queryKeys.liveGameweek(gw),
    queryFn: () => fetchLiveGameweek(gw),
    enabled: !!gw,
    staleTime: 30_000,
    refetchInterval: 90_000,
  });

export const fixturesQueryOptions = (gw: number) =>
  queryOptions({
    queryKey: queryKeys.fixtures(gw),
    queryFn: () => fetchFixtures(gw),
    enabled: !!gw,
    staleTime: 60_000,
    refetchInterval: 90_000,
  });

export const allFixturesQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.allFixtures,
    queryFn: fetchAllFixtures,
    staleTime: 10 * 60_000,
  });

export const classicLeagueQueryOptions = (id: number | null, page: number) =>
  queryOptions({
    queryKey: queryKeys.classicLeague(id ?? 0, page),
    queryFn: () => fetchClassicLeague(id as number, page),
    enabled: id !== null,
  });
