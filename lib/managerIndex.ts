import { Pool } from "pg";

export interface ManagerRecord {
  entry: number;
  entry_name: string;
  player_first_name: string;
  player_last_name: string;
}

const connectionString =
  process.env.POSTGRES_URL || process.env.DATABASE_URL || "";

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: connectionString.includes("localhost")
        ? undefined
        : { rejectUnauthorized: false },
    })
  : null;

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!pool) return Promise.resolve();
  if (!schemaReady) {
    schemaReady = pool
      .query(
        `CREATE TABLE IF NOT EXISTS managers (
           entry INTEGER PRIMARY KEY,
           entry_name TEXT NOT NULL,
           player_first_name TEXT NOT NULL,
           player_last_name TEXT NOT NULL,
           updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
         )`,
      )
      .then(async () => {
        await pool.query(
          `CREATE INDEX IF NOT EXISTS managers_entry_name_lower_idx
             ON managers (lower(entry_name))`,
        );
        await pool.query(
          `CREATE INDEX IF NOT EXISTS managers_player_name_lower_idx
             ON managers (lower(player_first_name || ' ' || player_last_name))`,
        );
        // Best-effort: accelerates ILIKE '%text%' scans at larger scale.
        // Skipped silently if the DB user lacks CREATE EXTENSION privilege.
        try {
          await pool.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
          await pool.query(
            `CREATE INDEX IF NOT EXISTS managers_entry_name_trgm_idx
               ON managers USING gin (entry_name gin_trgm_ops)`,
          );
        } catch {
          // pg_trgm unavailable — searches still work, just unindexed at scale.
        }
      });
  }
  return schemaReady;
}

export async function upsertFromLeagueEntries(
  entries: { entry: number; entry_name: string; player_name: string }[],
): Promise<void> {
  if (entries.length === 0 || !pool) return;
  await ensureSchema();
  const values: string[] = [];
  const params: unknown[] = [];
  entries.forEach((e, i) => {
    const trimmed = (e.player_name || "").trim();
    const spaceIdx = trimmed.indexOf(" ");
    const first = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
    const last = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1);
    const base = i * 4;
    values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, now())`);
    params.push(e.entry, e.entry_name, first, last);
  });
  await pool.query(
    `INSERT INTO managers (entry, entry_name, player_first_name, player_last_name, updated_at)
     VALUES ${values.join(", ")}
     ON CONFLICT (entry) DO UPDATE SET
       entry_name = EXCLUDED.entry_name,
       player_first_name = EXCLUDED.player_first_name,
       player_last_name = EXCLUDED.player_last_name,
       updated_at = now()
     WHERE managers.entry_name IS DISTINCT FROM EXCLUDED.entry_name
        OR managers.player_first_name IS DISTINCT FROM EXCLUDED.player_first_name
        OR managers.player_last_name IS DISTINCT FROM EXCLUDED.player_last_name`,
    params,
  );
}

export async function upsertFromManagerInfo(info: {
  id: number;
  name: string;
  player_first_name: string;
  player_last_name: string;
}): Promise<void> {
  if (!pool) return;
  await ensureSchema();
  await pool.query(
    `INSERT INTO managers (entry, entry_name, player_first_name, player_last_name, updated_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (entry) DO UPDATE SET
       entry_name = EXCLUDED.entry_name,
       player_first_name = EXCLUDED.player_first_name,
       player_last_name = EXCLUDED.player_last_name,
       updated_at = now()
     WHERE managers.entry_name IS DISTINCT FROM EXCLUDED.entry_name
        OR managers.player_first_name IS DISTINCT FROM EXCLUDED.player_first_name
        OR managers.player_last_name IS DISTINCT FROM EXCLUDED.player_last_name`,
    [info.id, info.name, info.player_first_name, info.player_last_name],
  );
}

export async function searchManagerIndex(
  query: string,
  limit = 8,
): Promise<ManagerRecord[]> {
  const q = query.trim();
  if (!q || !pool) return [];
  await ensureSchema();
  const contains = `%${q}%`;
  const prefix = `${q}%`;
  const { rows } = await pool.query(
    `SELECT entry, entry_name, player_first_name, player_last_name
     FROM managers
     WHERE entry_name ILIKE $1
        OR (player_first_name || ' ' || player_last_name) ILIKE $1
     ORDER BY
       CASE WHEN entry_name ILIKE $2
              OR (player_first_name || ' ' || player_last_name) ILIKE $2
            THEN 0 ELSE 1 END,
       length(entry_name)
     LIMIT $3`,
    [contains, prefix, limit],
  );
  return rows;
}

export async function managerIndexSize(): Promise<number> {
  if (!pool) return 0;
  await ensureSchema();
  const { rows } = await pool.query<{ count: string }>(
    `SELECT count(*) FROM managers`,
  );
  return Number(rows[0]?.count ?? 0);
}
