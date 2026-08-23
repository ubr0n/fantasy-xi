import type { Pick, LiveElement, Player, Fixture, SubPair } from "./fpl";

// The only starting formations FPL allows (GKP is always exactly 1, omitted
// here) — DEF-MID-FWD. A substitution is only applied if the resulting XI
// still matches one of these.
const VALID_FORMATIONS = new Set(["3-4-3", "3-5-2", "4-3-3", "4-4-2", "4-5-1", "5-3-2", "5-4-1"]);

function teamFixturesConfirmedDone(teamId: number, fixtures: Fixture[]): boolean {
  const teamFixtures = fixtures.filter((f) => f.team_h === teamId || f.team_a === teamId);
  if (teamFixtures.length === 0) return true; // blank gameweek for this team
  return teamFixtures.every((f) => f.finished_provisional);
}

/**
 * A player only counts as a confirmed non-appearance once their fixture(s)
 * have actually finished — 0 minutes while a match is still in progress (or
 * hasn't kicked off) doesn't mean they won't come on later.
 */
export function buildConfirmedZero(
  liveData: Map<number, LiveElement>,
  playerMap: Map<number, Player>,
  fixtures: Fixture[]
): (element: number) => boolean {
  const doneCache = new Map<number, boolean>();
  return (element: number): boolean => {
    const live = liveData.get(element);
    if (!live || live.stats.minutes > 0) return false;
    const player = playerMap.get(element);
    if (!player) return false;
    let done = doneCache.get(player.team);
    if (done === undefined) {
      done = teamFixturesConfirmedDone(player.team, fixtures);
      doneCache.set(player.team, done);
    }
    return done;
  };
}

/** Element that should carry the captain-tier multiplier this gameweek, or null if nobody should. */
export function computeArmbandElement(
  picks: Pick[],
  confirmedZero: (element: number) => boolean
): number | null {
  const captainPick = picks.find((p) => p.is_captain);
  const vicePick = picks.find((p) => p.is_vice_captain);
  if (!captainPick) return null;
  if (!confirmedZero(captainPick.element)) return captainPick.element;
  if (vicePick && !confirmedZero(vicePick.element)) return vicePick.element;
  return null;
}

/**
 * Mirrors FPL's own automatic-substitution engine, for use while a gameweek
 * is still live (FPL only publishes its official `automatic_subs` once the
 * whole gameweek is finalized, which is too late for a live-scores view).
 */
export function computeProvisionalAutoSubs(
  picks: Pick[],
  playerMap: Map<number, Player>,
  confirmedZero: (element: number) => boolean
): SubPair[] {
  const starting = [...picks].filter((p) => p.position <= 11).sort((a, b) => a.position - b.position);
  const bench = [...picks].filter((p) => p.position > 11).sort((a, b) => a.position - b.position);

  const typeOf = (element: number) => playerMap.get(element)?.element_type ?? 0;

  const benchGK = bench.find((p) => typeOf(p.element) === 1);
  const benchOutfield = bench.filter((p) => typeOf(p.element) !== 1);
  const usedBench = new Set<number>();
  const subs: SubPair[] = [];
  const effective = new Set(starting.map((p) => p.element));

  const startingGK = starting.find((p) => typeOf(p.element) === 1);
  if (startingGK && confirmedZero(startingGK.element) && benchGK && !confirmedZero(benchGK.element)) {
    effective.delete(startingGK.element);
    effective.add(benchGK.element);
    usedBench.add(benchGK.element);
    subs.push({ element_in: benchGK.element, element_out: startingGK.element });
  }

  const countsByType = () => {
    const counts: Record<2 | 3 | 4, number> = { 2: 0, 3: 0, 4: 0 };
    for (const el of effective) {
      const t = typeOf(el);
      if (t === 2 || t === 3 || t === 4) counts[t]++;
    }
    return counts;
  };
  const isLegal = (counts: Record<2 | 3 | 4, number>) =>
    VALID_FORMATIONS.has(`${counts[2]}-${counts[3]}-${counts[4]}`);

  for (const starter of starting) {
    if (typeOf(starter.element) === 1) continue; // GK handled above
    if (!confirmedZero(starter.element)) continue;

    for (const candidate of benchOutfield) {
      if (usedBench.has(candidate.element)) continue;
      if (confirmedZero(candidate.element)) continue;

      const counts = countsByType();
      const outType = typeOf(starter.element) as 2 | 3 | 4;
      const inType = typeOf(candidate.element) as 2 | 3 | 4;
      counts[outType]--;
      counts[inType]++;
      if (!isLegal(counts)) continue;

      effective.delete(starter.element);
      effective.add(candidate.element);
      usedBench.add(candidate.element);
      subs.push({ element_in: candidate.element, element_out: starter.element });
      break;
    }
  }

  return subs;
}

/**
 * Re-derives each pick's display `position` (<=11 starting, >11 bench) and
 * `multiplier` after applying substitutions, so existing "position <= 11"
 * grouping/rendering code (pitch layout, list view) shows the actual
 * effective lineup without needing its own sub-awareness.
 */
export function applyEffectiveLineup(
  picks: Pick[],
  subs: SubPair[],
  armbandElement: number | null,
  isBenchBoost: boolean
): Pick[] {
  if (isBenchBoost || subs.length === 0) {
    if (armbandElement === null) return picks;
    const captainPick = picks.find((p) => p.is_captain);
    const armbandMultiplier = captainPick?.multiplier ?? 2;
    return picks.map((p) =>
      p.element === armbandElement ? { ...p, multiplier: armbandMultiplier } : p
    );
  }

  const positionByElement = new Map(picks.map((p) => [p.element, p.position]));
  for (const sub of subs) {
    const outPos = positionByElement.get(sub.element_out);
    const inPos = positionByElement.get(sub.element_in);
    if (outPos === undefined || inPos === undefined) continue;
    positionByElement.set(sub.element_out, inPos);
    positionByElement.set(sub.element_in, outPos);
  }

  const subbedOut = new Set(subs.map((s) => s.element_out));
  const subbedIn = new Set(subs.map((s) => s.element_in));
  const captainPick = picks.find((p) => p.is_captain);
  const armbandMultiplier = captainPick?.multiplier ?? 2;

  return picks.map((p) => {
    const position = positionByElement.get(p.element) ?? p.position;
    let multiplier = p.multiplier;
    if (p.element === armbandElement) multiplier = armbandMultiplier;
    else if (subbedOut.has(p.element)) multiplier = 0;
    else if (subbedIn.has(p.element)) multiplier = 1;
    return { ...p, position, multiplier };
  });
}
