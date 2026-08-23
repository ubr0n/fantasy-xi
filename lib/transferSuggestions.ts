import type { Pick, Player, Fixture } from "./fpl";
import {
  predictNextGwPoints,
  computeFixtureRun,
  averageFixtureDifficulty,
  fixtureRunScore,
  availabilityMultiplier,
} from "./predictions";

const MIN_PEER_MINUTES = 180;
const WEAKNESS_THRESHOLD = 2;
const MAX_OUT_SUGGESTIONS = 3;
const MAX_IN_CANDIDATES = 3;
const BUDGET_STRETCH_TENTHS = 20; // £2.0m

const W_RELATIVE = 1.5;
const W_FIXTURE = 1.0;
const W_AVAIL = 1.0;
const W_TREND = 1.0;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export interface WeaknessBreakdown {
  element: number;
  weaknessScore: number;
  predicted: number;
  peerAvgPredicted: number;
  fixtureRunScore: number;
  availabilityPenalty: number;
  formTrendPenalty: number;
  reasons: string[];
}

export interface ReplacementCandidate {
  element: number;
  predicted: number;
  cost: number;
  fixtureRunScore: number;
  reasons: string[];
}

export interface TransferSuggestion {
  out: WeaknessBreakdown;
  in: ReplacementCandidate[];
}

function playerFixtureRunScore(player: Player, allFixtures: Fixture[], fromEvent: number): number {
  const run = computeFixtureRun(player.team, allFixtures, fromEvent);
  return fixtureRunScore(averageFixtureDifficulty(run));
}

function computePeerAverages(
  allPlayers: Player[],
  predicted: Map<number, number>
): Map<number, number> {
  const sums = new Map<number, { total: number; count: number }>();
  for (const p of allPlayers) {
    if (p.minutes < MIN_PEER_MINUTES) continue;
    const entry = sums.get(p.element_type) ?? { total: 0, count: 0 };
    entry.total += predicted.get(p.id) ?? 0;
    entry.count += 1;
    sums.set(p.element_type, entry);
  }
  const averages = new Map<number, number>();
  for (const [type, { total, count }] of sums) {
    averages.set(type, count > 0 ? total / count : 0);
  }
  return averages;
}

function weaknessFor(
  player: Player,
  predicted: number,
  peerAvg: number,
  fixScore: number,
  avail: number
): WeaknessBreakdown {
  const relative = clamp(peerAvg - predicted, -3, 5) * W_RELATIVE;
  const fixturePenalty = -fixScore * W_FIXTURE;
  const availabilityPenalty = (1 - avail) * 5 * W_AVAIL;
  const ppg = parseFloat(player.points_per_game) || 0;
  const form = parseFloat(player.form) || 0;
  const formTrendPenalty = clamp(ppg - form, -2, 2) * W_TREND;

  const weaknessScore = relative + fixturePenalty + availabilityPenalty + formTrendPenalty;

  const reasons: string[] = [];
  if (relative > 0.75) reasons.push("Below position peer average");
  if (fixturePenalty > 0.75) reasons.push("Tough run of fixtures ahead");
  if (availabilityPenalty > 1) {
    const pct = Math.round(avail * 100);
    reasons.push(`Fitness doubt (${pct}% chance of playing)`);
  }
  if (formTrendPenalty > 0.75) reasons.push("Form cooling off");

  return {
    element: player.id,
    weaknessScore,
    predicted,
    peerAvgPredicted: peerAvg,
    fixtureRunScore: fixScore,
    availabilityPenalty,
    formTrendPenalty,
    reasons,
  };
}

function findCandidates(
  allPlayers: Player[],
  predicted: Map<number, number>,
  elementType: number,
  excludeIds: Set<number>,
  budget: number,
  allFixtures: Fixture[],
  fromEvent: number
): ReplacementCandidate[] {
  return allPlayers
    .filter((p) => p.element_type === elementType)
    .filter((p) => !excludeIds.has(p.id))
    .filter((p) => p.now_cost <= budget)
    .filter((p) => availabilityMultiplier(p) >= 0.75)
    .map((p) => {
      const fixScore = playerFixtureRunScore(p, allFixtures, fromEvent);
      return {
        element: p.id,
        predicted: predicted.get(p.id) ?? 0,
        cost: p.now_cost,
        fixtureRunScore: fixScore,
        reasons: [] as string[],
      };
    })
    .sort((a, b) => b.predicted - a.predicted || b.fixtureRunScore - a.fixtureRunScore);
}

export function suggestTransfers(params: {
  picks: Pick[];
  bank: number;
  playerMap: Map<number, Player>;
  allFixtures: Fixture[];
  fromEvent: number;
  maxSuggestions?: number;
}): TransferSuggestion[] {
  const { picks, bank, playerMap, allFixtures, fromEvent, maxSuggestions = MAX_OUT_SUGGESTIONS } = params;

  const allPlayers = Array.from(playerMap.values());
  const predicted = new Map(allPlayers.map((p) => [p.id, predictNextGwPoints(p).predicted]));
  const peerAvgs = computePeerAverages(allPlayers, predicted);
  const squadIds = new Set(picks.map((p) => p.element));

  const weaknesses = picks
    .map((pick) => playerMap.get(pick.element))
    .filter((p): p is Player => p !== undefined)
    .map((player) => {
      const fixScore = playerFixtureRunScore(player, allFixtures, fromEvent);
      const avail = availabilityMultiplier(player);
      return weaknessFor(
        player,
        predicted.get(player.id) ?? 0,
        peerAvgs.get(player.element_type) ?? 0,
        fixScore,
        avail
      );
    })
    .filter((w) => w.weaknessScore > WEAKNESS_THRESHOLD)
    .sort((a, b) => b.weaknessScore - a.weaknessScore)
    .slice(0, maxSuggestions);

  return weaknesses.map((w) => {
    const outPlayer = playerMap.get(w.element)!;
    const approxSell = outPlayer.now_cost;
    const budget = approxSell + bank;

    let candidates = findCandidates(
      allPlayers,
      predicted,
      outPlayer.element_type,
      squadIds,
      budget,
      allFixtures,
      fromEvent
    );

    if (candidates.length === 0) {
      candidates = findCandidates(
        allPlayers,
        predicted,
        outPlayer.element_type,
        squadIds,
        budget + BUDGET_STRETCH_TENTHS,
        allFixtures,
        fromEvent
      ).map((c) => ({ ...c, reasons: [...c.reasons, "Stretch target — above approximate budget"] }));
    }

    return { out: w, in: candidates.slice(0, MAX_IN_CANDIDATES) };
  });
}
