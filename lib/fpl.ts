const API_BASE = '/api/fpl';

async function fplFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}?path=${encodeURIComponent(path)}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BootstrapStatic {
  events: GameWeek[];
  teams: Team[];
  elements: Player[];
  element_types: ElementType[];
}

export interface GameWeek {
  id: number;
  name: string;
  deadline_time: string;
  finished: boolean;
  is_current: boolean;
  is_next: boolean;
  average_entry_score: number;
  highest_score: number;
  most_captained: number;
  most_vice_captained: number;
  most_selected: number;
  most_transferred_in: number;
  chip_plays: ChipPlay[];
  top_element: number;
  top_element_info?: { id: number; points: number };
  transfers_made: number;
}

export interface ChipPlay {
  chip_name: string;
  num_played: number;
}

export interface Team {
  id: number;
  name: string;
  short_name: string;
  code: number;
  strength: number;
}

export interface Player {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  element_type: number;
  total_points: number;
  event_points: number;
  now_cost: number;
  selected_by_percent: string;
  form: string;
  points_per_game: string;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  yellow_cards: number;
  red_cards: number;
  status: string;
  news: string;
  code: number;
  ep_next: string;
  ep_this: string;
  chance_of_playing_next_round: number | null;
  chance_of_playing_this_round: number | null;
  minutes: number;
  expected_goals_per_90: number;
  expected_assists_per_90: number;
  expected_goal_involvements_per_90: number;
  ict_index_rank: number;
  transfers_in_event: number;
  transfers_out_event: number;
  value_form: string;
  value_season: string;
}

export interface ElementType {
  id: number;
  singular_name: string;
  singular_name_short: string;
  plural_name: string;
}

export interface ManagerInfo {
  id: number;
  player_first_name: string;
  player_last_name: string;
  player_region_name: string;
  summary_overall_points: number;
  summary_overall_rank: number;
  summary_event_points: number;
  summary_event_rank: number;
  current_event: number;
  name: string;
  started_event: number;
  favourite_team: number | null;
  leagues: {
    classic: LeagueMembership[];
    h2h: LeagueMembership[];
  };
}

export interface LeagueMembership {
  id: number;
  name: string;
  entry_rank: number;
  entry_last_rank: number;
  short_name?: string;
}

export interface ManagerHistory {
  current: CurrentGWStats[];
  past: PastSeason[];
  chips: ChipUsage[];
}

export interface CurrentGWStats {
  event: number;
  points: number;
  total_points: number;
  rank: number;
  rank_sort: number;
  overall_rank: number;
  bank: number;
  value: number;
  event_transfers: number;
  event_transfers_cost: number;
  points_on_bench: number;
}

export interface PastSeason {
  season_name: string;
  total_points: number;
  rank: number;
}

export interface ChipUsage {
  name: string;
  time: string;
  event: number;
}

export interface ManagerPicks {
  active_chip: string | null;
  automatic_subs: AutoSub[];
  entry_history: CurrentGWStats;
  picks: Pick[];
}

export interface AutoSub {
  entry: number;
  element_in: number;
  element_out: number;
  event: number;
}

export interface Pick {
  element: number;
  position: number;
  multiplier: number;
  is_captain: boolean;
  is_vice_captain: boolean;
}

export interface LiveGameweek {
  elements: LiveElement[];
}

export interface LiveElement {
  id: number;
  stats: LiveStats;
  explain: ExplainRow[];
}

export interface LiveStats {
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  total_points: number;
  in_dreamteam: boolean;
}

export interface ExplainRow {
  fixture: number;
  stats: { identifier: string; points: number; value: number }[];
}

export interface Fixture {
  id: number;
  event: number | null;
  team_h: number;
  team_a: number;
  started: boolean;
  finished: boolean;
  finished_provisional: boolean;
  kickoff_time: string | null;
  team_h_difficulty: number;
  team_a_difficulty: number;
}

export interface ClassicLeague {
  league: {
    id: number;
    name: string;
    created: string;
    has_cup: boolean;
  };
  standings: {
    has_next: boolean;
    page: number;
    results: LeagueEntry[];
  };
}

export interface LeagueEntry {
  event_total: number;
  player_name: string;
  rank: number;
  last_rank: number;
  rank_sort: number;
  total: number;
  entry: number;
  entry_name: string;
}

export interface ManagerSearchResult {
  entry: number;
  entry_name: string;
  player_first_name: string;
  player_last_name: string;
}

export interface ManagerSearchResponse {
  results: ManagerSearchResult[];
}

export interface EventStatus {
  leagues: string;
  status: { bonus_added: boolean; date: string; event: number; points: string }[];
}

export interface DreamTeam {
  top_player: { id: number; points: number };
  team: { element: number; points: number; position: number }[];
}

// ── API functions ─────────────────────────────────────────────────────────────

export const fetchBootstrap = () => fplFetch<BootstrapStatic>('bootstrap-static/');

export const fetchManager = (id: number) => fplFetch<ManagerInfo>(`entry/${id}/`);

export const fetchManagerHistory = (id: number) =>
  fplFetch<ManagerHistory>(`entry/${id}/history/`);

export const fetchManagerPicks = (managerId: number, eventId: number) =>
  fplFetch<ManagerPicks>(`entry/${managerId}/event/${eventId}/picks/`);

export const fetchLiveGameweek = (eventId: number) =>
  fplFetch<LiveGameweek>(`event/${eventId}/live/`);

export const fetchClassicLeague = (leagueId: number, page = 1) =>
  fplFetch<ClassicLeague>(`leagues-classic/${leagueId}/standings/?page_standings=${page}`);

export const fetchEventStatus = () => fplFetch<EventStatus>('event-status/');

export const fetchFixtures = (eventId: number) =>
  fplFetch<Fixture[]>(`fixtures/?event=${eventId}`);

export const fetchAllFixtures = () => fplFetch<Fixture[]>('fixtures/');

/** The player's next unfinished fixture this gameweek, for showing "who's up next" instead of a 0 before kickoff. */
export function getUpcomingFixture(
  teamId: number,
  fixtures: Fixture[],
  event: number,
  teamMap: Map<number, Team>
): { opponent: string; isHome: boolean } | null {
  const match = fixtures.find(
    (f) => f.event === event && !f.finished && (f.team_h === teamId || f.team_a === teamId)
  );
  if (!match) return null;
  const isHome = match.team_h === teamId;
  const opponent = teamMap.get(isHome ? match.team_a : match.team_h);
  return opponent ? { opponent: opponent.short_name, isHome } : null;
}

export const searchManagers = async (text: string): Promise<ManagerSearchResponse> => {
  const res = await fetch(`/api/search-managers?text=${encodeURIComponent(text)}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();
};

export const fetchDreamTeam = (eventId: number) =>
  fplFetch<DreamTeam>(`dream-team/${eventId}/`);

// ── Helpers ────────────────────────────────────────────────────────────────────

export function getPlayerPhoto(code: number) {
  return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${code}.png`;
}

export function getTeamBadge(code: number) {
  return `https://resources.premierleague.com/premierleague/badges/70/t${code}.png`;
}

export function formatCost(cost: number) {
  return `£${(cost / 10).toFixed(1)}m`;
}

export function getPositionName(elementType: number) {
  const map: Record<number, string> = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
  return map[elementType] || '?';
}

export function getPositionColor(elementType: number) {
  const map: Record<number, string> = {
    1: '#00ff87',
    2: '#04f5ff',
    3: '#e90052',
    4: '#ff7b00',
  };
  return map[elementType] || '#fff';
}

// Season total with the current gameweek's stale FPL figure swapped out for
// our live/auto-sub-corrected one, so standings reflect what's actually happening.
export function liveSeasonTotal(entry: {
  total: number;
  event_total: number;
  livePoints?: number;
}): number {
  const liveScore = entry.livePoints ?? entry.event_total;
  return entry.total - entry.event_total + liveScore;
}

export function getRankArrow(rank: number, lastRank: number) {
  if (rank < lastRank) return 'up';
  if (rank > lastRank) return 'down';
  return 'same';
}

export interface SubPair {
  element_in: number;
  element_out: number;
}

export function calculateLivePoints(
  picks: Pick[],
  liveData: Map<number, LiveElement>,
  activeChip?: string | null,
  automaticSubs: SubPair[] = [],
  // Element that gets the captain-tier multiplier this GW. Omit to decide
  // from raw live minutes (default); pass explicitly (or null) when the
  // caller has already worked out a fixture-confirmed armband decision.
  armbandOverride?: number | null
): { total: number; bench: number; playing: number } {
  const isBenchBoost = activeChip === "bboost";
  // Bench Boost counts the full 15, so FPL never runs auto-subs for that gameweek.
  const subbedOut = isBenchBoost ? new Set<number>() : new Set(automaticSubs.map((s) => s.element_out));
  const subbedIn = isBenchBoost ? new Set<number>() : new Set(automaticSubs.map((s) => s.element_in));

  // If the captain didn't play, the armband (and its multiplier) passes to the
  // vice-captain instead — but only if the vice-captain played.
  const captainPick = picks.find((p) => p.is_captain);
  const vicePick = picks.find((p) => p.is_vice_captain);

  let armbandElement: number | null;
  if (armbandOverride !== undefined) {
    armbandElement = armbandOverride;
  } else {
    const hasPlayed = (pick?: Pick) => {
      const live = pick && liveData.get(pick.element);
      return !!live && live.stats.minutes > 0;
    };
    if (!captainPick) armbandElement = null;
    else if (hasPlayed(captainPick)) armbandElement = captainPick.element;
    else if (hasPlayed(vicePick)) armbandElement = vicePick!.element;
    else armbandElement = null;
  }
  const armbandMultiplier = captainPick?.multiplier ?? 2;

  let playing = 0;
  let bench = 0;

  for (const pick of picks) {
    const live = liveData.get(pick.element);
    if (!live) continue;
    const rawPts = live.stats.total_points;

    if (pick.position <= 11) {
      if (subbedOut.has(pick.element)) continue;
      const multiplier = pick.element === armbandElement ? armbandMultiplier : pick.multiplier;
      playing += rawPts * multiplier;
    } else if (isBenchBoost) {
      // Informational even though already counted — mirrors FPL's own "Bench Boost" display.
      bench += rawPts;
      playing += rawPts;
    } else if (subbedIn.has(pick.element)) {
      // No longer "left on the bench" — they're an active part of the XI now.
      const multiplier = pick.element === armbandElement ? armbandMultiplier : 1;
      playing += rawPts * multiplier;
    } else {
      bench += rawPts;
    }
  }

  return { total: playing, bench, playing };
}
