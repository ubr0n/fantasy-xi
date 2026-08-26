import type { LeagueEntry, Pick as FplPick, LiveElement, SubPair } from "@/lib/fpl";
import { calculateLivePoints } from "@/lib/fpl";

export type MobileTab = "league" | "team" | "live" | "stats";
export type RightView = "inplay" | "feed" | "chips" | "ownership";

export interface EnrichedEntry extends LeagueEntry {
  livePoints?: number;
  chipActive?: string | null;
  captain?: number;
  entryPicks?: FplPick[];
  subs?: SubPair[];
}

export const CHIP_LABELS: Record<string, string> = {
  wildcard: "Wildcard",
  freehit: "Free Hit",
  bboost: "Bench Boost",
  "3xc": "Triple Cap",
};

export const CHIP_CLASSES: Record<string, string> = {
  wildcard: "chip-wildcard",
  freehit: "chip-freehit",
  bboost: "chip-bboost",
  "3xc": "chip-3xc",
};

export const STAT_META: Record<string, [string, string]> = {
  minutes: ["Playing Time", "⏱"],
  goals_scored: ["Goal", "⚽"],
  assists: ["Assist", "🅰️"],
  clean_sheets: ["Clean Sheet", "🧤"],
  goals_conceded: ["Goals Conceded", "⬇️"],
  own_goals: ["Own Goal", "❌"],
  penalties_saved: ["Penalty Saved", "🥅"],
  penalties_missed: ["Penalty Missed", "❌"],
  yellow_cards: ["Yellow Card", "🟨"],
  red_cards: ["Red Card", "🟥"],
  saves: ["Saves", "🧤"],
  bonus: ["Bonus Points", "⭐"],
};

export function calcScore(
  picks: FplPick[],
  liveMap: Map<number, LiveElement>,
  activeChip?: string | null,
  automaticSubs?: SubPair[],
  armbandElement?: number | null,
) {
  const { total, bench } = calculateLivePoints(
    picks,
    liveMap,
    activeChip,
    automaticSubs,
    armbandElement,
  );
  return { total, bench };
}
