export const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'PLAYER' CHECK (role IN ('PLAYER','ORGANIZER','ADMIN')),
  avatar_color  TEXT NOT NULL DEFAULT '#d8ff3e',
  bio           TEXT NOT NULL DEFAULT '',
  wallet_balance INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS games (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  publisher   TEXT NOT NULL DEFAULT '',
  platforms   TEXT NOT NULL DEFAULT '',
  cover       TEXT NOT NULL DEFAULT '',
  accent      TEXT NOT NULL DEFAULT '#d8ff3e',
  description TEXT NOT NULL DEFAULT '',
  active      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS tournaments (
  id              TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  game_id         TEXT NOT NULL REFERENCES games(id),
  description     TEXT NOT NULL DEFAULT '',
  rules           TEXT NOT NULL DEFAULT '[]',
  format          TEXT NOT NULL DEFAULT 'Squad',
  mode            TEXT NOT NULL DEFAULT 'TPP',
  map             TEXT NOT NULL DEFAULT '',
  platform        TEXT NOT NULL DEFAULT 'Mobile',
  entry_fee       INTEGER NOT NULL DEFAULT 0,
  prize_pool      INTEGER NOT NULL DEFAULT 0,
  prize_breakdown TEXT NOT NULL DEFAULT '[]',
  per_kill_reward INTEGER NOT NULL DEFAULT 0,
  max_slots       INTEGER NOT NULL DEFAULT 100,
  starts_at       TEXT NOT NULL,
  ends_at         TEXT,
  status          TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING','LIVE','COMPLETED','CANCELLED')),
  room_id         TEXT,
  room_password   TEXT,
  stream_url      TEXT,
  featured        INTEGER NOT NULL DEFAULT 0,
  created_by      TEXT REFERENCES users(id),
  created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS registrations (
  id            TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id),
  user_id       TEXT NOT NULL REFERENCES users(id),
  team_name     TEXT,
  ign           TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED','CANCELLED','REFUNDED')),
  placement     INTEGER,
  kills         INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  UNIQUE (tournament_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_reg_tournament ON registrations(tournament_id);
CREATE INDEX IF NOT EXISTS idx_reg_user ON registrations(user_id);

CREATE TABLE IF NOT EXISTS payments (
  id                 TEXT PRIMARY KEY,
  order_id           TEXT NOT NULL UNIQUE,
  user_id            TEXT NOT NULL REFERENCES users(id),
  tournament_id      TEXT NOT NULL REFERENCES tournaments(id),
  amount             INTEGER NOT NULL,
  currency           TEXT NOT NULL DEFAULT 'INR',
  gateway            TEXT NOT NULL DEFAULT 'mock',
  gateway_payment_id TEXT,
  signature          TEXT,
  meta               TEXT NOT NULL DEFAULT '{}',
  status             TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED','PAID','FAILED','REFUNDED')),
  created_at         TEXT NOT NULL,
  paid_at            TEXT
);
CREATE INDEX IF NOT EXISTS idx_pay_user ON payments(user_id);

CREATE TABLE IF NOT EXISTS matches (
  id            TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id),
  round         TEXT NOT NULL,
  label         TEXT NOT NULL,
  scheduled_at  TEXT,
  status        TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','LIVE','COMPLETED')),
  note          TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL REFERENCES users(id),
  tournament_id    TEXT NOT NULL REFERENCES tournaments(id),
  season           TEXT NOT NULL,
  placement        INTEGER,
  kills            INTEGER NOT NULL DEFAULT 0,
  placement_points INTEGER NOT NULL DEFAULT 0,
  kill_points      INTEGER NOT NULL DEFAULT 0,
  bonus_points     INTEGER NOT NULL DEFAULT 0,
  total_points     INTEGER NOT NULL DEFAULT 0,
  prize_won        INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL,
  UNIQUE (user_id, tournament_id)
);
CREATE INDEX IF NOT EXISTS idx_lb_user ON leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_lb_season ON leaderboard_entries(season);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  amount     INTEGER NOT NULL,
  type       TEXT NOT NULL,
  note       TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet_transactions(user_id);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  kind       TEXT NOT NULL DEFAULT 'info',
  read       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read);

CREATE TABLE IF NOT EXISTS withdrawals (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id),
  amount       INTEGER NOT NULL,
  upi_id       TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','PAID','REJECTED')),
  note         TEXT NOT NULL DEFAULT '',
  created_at   TEXT NOT NULL,
  processed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_wd_status ON withdrawals(status);
`;
