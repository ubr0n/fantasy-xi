import type { Player, Fixture } from "./fpl";

const MOMENTUM_WEIGHT = 0.3;
const MOMENTUM_CAP = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** How much of a player's expected return should count, given injury/rotation risk. */
export function availabilityMultiplier(p: Player): number {
  if (p.status === "a") {
    return p.chance_of_playing_next_round === null ? 1 : p.chance_of_playing_next_round / 100;
  }
  if (p.chance_of_playing_next_round !== null) {
    return p.chance_of_playing_next_round / 100;
  }
  // No percentage published yet for a doubtful/injured/suspended player.
  return p.status === "d" ? 0.5 : 0;
}

export interface PredictionBreakdown {
  predicted: number;
  baseline: number;
  momentumDelta: number;
  availabilityMultiplier: number;
}

/**
 * FPL's own ep_next is already fixture-adjusted and should dominate; a small
 * momentum term nudges players clearly heating up or cooling off, and
 * availability is applied last as a straight multiplier so a low-chance
 * player has their whole projected return discounted, not a flat subtraction.
 */
export function predictNextGwPoints(p: Player): PredictionBreakdown {
  const baseline = parseFloat(p.ep_next) || 0;
  const form = parseFloat(p.form) || 0;
  const ppg = parseFloat(p.points_per_game) || 0;
  const momentumDelta = clamp(form - ppg, -MOMENTUM_CAP, MOMENTUM_CAP);
  const preAvailability = Math.max(0, baseline + momentumDelta * MOMENTUM_WEIGHT);
  const avail = availabilityMultiplier(p);
  return {
    predicted: round1(preAvailability * avail),
    baseline,
    momentumDelta,
    availabilityMultiplier: avail,
  };
}

export interface FixtureRunEntry {
  event: number;
  opponentTeamId: number;
  isHome: boolean;
  difficulty: number;
}

export function computeFixtureRun(
  teamId: number,
  allFixtures: Fixture[],
  fromEvent: number,
  n = 5
): FixtureRunEntry[] {
  return allFixtures
    .filter((f) => f.event !== null && f.event >= fromEvent && (f.team_h === teamId || f.team_a === teamId))
    .sort((a, b) => (a.event as number) - (b.event as number))
    .slice(0, n)
    .map((f) => {
      const isHome = f.team_h === teamId;
      return {
        event: f.event as number,
        opponentTeamId: isHome ? f.team_a : f.team_h,
        isHome,
        difficulty: isHome ? f.team_h_difficulty : f.team_a_difficulty,
      };
    });
}

export function averageFixtureDifficulty(run: FixtureRunEntry[]): number {
  if (run.length === 0) return 3; // neutral default for a blank-heavy stretch
  return run.reduce((sum, r) => sum + r.difficulty, 0) / run.length;
}

/** Positive = easy run ahead, negative = hard run ahead. */
export function fixtureRunScore(avgDifficulty: number): number {
  return clamp(3 - avgDifficulty, -2, 2);
}
