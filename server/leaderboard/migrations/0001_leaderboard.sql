CREATE TABLE IF NOT EXISTS leaderboard (
  player_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  points INTEGER NOT NULL CHECK (points BETWEEN 0 AND 80),
  max_points INTEGER NOT NULL CHECK (max_points = 80),
  ending TEXT NOT NULL CHECK (ending IN ('heist', 'open-file')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS leaderboard_ranking ON leaderboard(points DESC, created_at ASC);
