const schema = [
  `CREATE TABLE IF NOT EXISTS leaderboard (
    player_id TEXT PRIMARY KEY, display_name TEXT NOT NULL,
    points INTEGER NOT NULL CHECK (points BETWEEN 0 AND 80),
    max_points INTEGER NOT NULL CHECK (max_points = 80),
    ending TEXT NOT NULL CHECK (ending IN ('heist', 'open-file')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  'ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS total_time_ms BIGINT',
  'CREATE INDEX IF NOT EXISTS leaderboard_ranking ON leaderboard(points DESC, created_at ASC)',
  'CREATE TABLE IF NOT EXISTS oauth_states (state_hash TEXT PRIMARY KEY, verifier TEXT NOT NULL, expires_at BIGINT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS login_tickets (ticket_hash TEXT PRIMARY KEY, github_id TEXT NOT NULL, login TEXT NOT NULL, expires_at BIGINT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, github_id TEXT NOT NULL, login TEXT NOT NULL, expires_at BIGINT NOT NULL)',
  'CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at)',
  'CREATE TABLE IF NOT EXISTS saves (github_id TEXT PRIMARY KEY, snapshot TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)',
];

export function databaseAdapter(sql) {
  return { prepare(query) {
    let values = [];
    let index = 0;
    const numbered = query.replace(/\?/g, () => `$${++index}`);
    return { bind(...params) { values = params; return this; },
      async first() { return (await sql.query(numbered, values))[0] || null; },
      async all() { return { results: await sql.query(numbered, values) }; },
      async run() { await sql.query(numbered, values); return { success: true }; },
    };
  } };
}

let initialized = null;
export async function ensureSchema(sql) {
  if (!initialized) initialized = (async () => { for (const statement of schema) await sql.query(statement); })();
  try { await initialized; } catch (error) { initialized = null; throw error; }
}
