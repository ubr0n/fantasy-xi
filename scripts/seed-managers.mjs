#!/usr/bin/env node
// Bootstraps the manager search index (Postgres) by crawling FPL classic
// league standings (the official FPL API has no manager name-search
// endpoint, so this is how coverage gets seeded before organic traffic
// builds it up further).
//
// Usage: POSTGRES_URL=postgres://... node scripts/seed-managers.mjs [leagueId] [maxPages]
//   leagueId  defaults to 314, the FPL "Overall" global league
//   maxPages  defaults to 200 (50 managers per page)

import { Pool } from "pg";

const LEAGUE_ID = process.argv[2] ? Number(process.argv[2]) : 314;
const MAX_PAGES = process.argv[3] ? Number(process.argv[3]) : 200;
const DELAY_MS = 300;

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set POSTGRES_URL (or DATABASE_URL) before running this script.");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("localhost")
    ? undefined
    : { rejectUnauthorized: false },
});

function splitPlayerName(playerName) {
  const trimmed = (playerName || "").trim();
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx === -1) return { first: trimmed, last: "" };
  return { first: trimmed.slice(0, spaceIdx), last: trimmed.slice(spaceIdx + 1) };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureSchema() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS managers (
       entry INTEGER PRIMARY KEY,
       entry_name TEXT NOT NULL,
       player_first_name TEXT NOT NULL,
       player_last_name TEXT NOT NULL,
       updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS managers_entry_name_lower_idx ON managers (lower(entry_name))`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS managers_player_name_lower_idx
       ON managers (lower(player_first_name || ' ' || player_last_name))`,
  );
}

async function upsertPage(results) {
  if (results.length === 0) return;
  const values = [];
  const params = [];
  results.forEach((r, i) => {
    const { first, last } = splitPlayerName(r.player_name);
    const base = i * 4;
    values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, now())`);
    params.push(r.entry, r.entry_name, first, last);
  });
  await pool.query(
    `INSERT INTO managers (entry, entry_name, player_first_name, player_last_name, updated_at)
     VALUES ${values.join(", ")}
     ON CONFLICT (entry) DO UPDATE SET
       entry_name = EXCLUDED.entry_name,
       player_first_name = EXCLUDED.player_first_name,
       player_last_name = EXCLUDED.player_last_name,
       updated_at = now()`,
    params,
  );
}

async function main() {
  await ensureSchema();

  let page = 1;
  let total = 0;

  while (page <= MAX_PAGES) {
    const url = `https://fantasy.premierleague.com/api/leagues-classic/${LEAGUE_ID}/standings/?page_standings=${page}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; FPLLiveDashboard/1.0)" },
    });

    if (!res.ok) {
      console.error(`page ${page}: HTTP ${res.status}, stopping`);
      break;
    }

    const data = await res.json();
    const results = data?.standings?.results ?? [];
    if (results.length === 0) break;

    await upsertPage(results);
    total += results.length;
    console.log(`page ${page}: +${results.length} managers (total ${total})`);

    if (!data.standings.has_next) break;
    page += 1;
    await sleep(DELAY_MS);
  }

  console.log(`Done. Upserted ${total} manager records.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
