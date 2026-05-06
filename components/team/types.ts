import type { LeagueEntry, Pick as FplPick, LiveElement } from "@/lib/fpl";

export type MobileTab = "league" | "team" | "live" | "stats";
export type RightView = "inplay" | "feed" | "chips" | "ownership";

export interface EnrichedEntry extends LeagueEntry {
  livePoints?: number;
  chipActive?: string | null;
  captain?: number;
  entryPicks?: FplPick[];
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

export function calcScore(picks: FplPick[], liveMap: Map<number, LiveElement>, activeChip?: string | null) {
  let total = 0,
    bench = 0;
  const isBenchBoost = activeChip === "bboost";
  for (const p of picks) {
    const live = liveMap.get(p.element);
    if (!live) continue;
    const rawPts = live.stats.total_points;
    const pts = rawPts * p.multiplier;
    if (p.position <= 11) total += pts;
    else {
      bench += rawPts;
      if (isBenchBoost) total += rawPts;
    }
  }
  return { total, bench };
}
