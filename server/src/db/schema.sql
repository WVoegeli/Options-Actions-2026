-- Options Trading Database Schema

-- Accounts (paper and live)
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('paper', 'live')) NOT NULL,
  starting_balance REAL NOT NULL,
  current_balance REAL NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Positions
CREATE TABLE IF NOT EXISTS positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  symbol TEXT NOT NULL,
  underlying TEXT NOT NULL,
  option_type TEXT CHECK(option_type IN ('call', 'put', 'stock')) NOT NULL,
  strike REAL,
  expiration DATE,
  quantity INTEGER NOT NULL,
  avg_cost REAL NOT NULL,
  current_price REAL DEFAULT 0,
  strategy_tag TEXT CHECK(strategy_tag IN (
    'wheel-csp', 'wheel-cc', 'pmcc',
    'bull-put-spread', 'bear-call-spread', 'iron-condor',
    'long-call', 'long-put', 'other'
  )),
  status TEXT CHECK(status IN ('open', 'closed', 'assigned', 'expired')) DEFAULT 'open',
  opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME,
  close_price REAL,
  pnl REAL DEFAULT 0,
  notes TEXT
);

-- Individual trades
CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position_id INTEGER NOT NULL REFERENCES positions(id),
  action TEXT CHECK(action IN ('open', 'close', 'roll', 'adjust')) NOT NULL,
  quantity INTEGER NOT NULL,
  price REAL NOT NULL,
  commission REAL DEFAULT 0,
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Trade journal entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trade_id INTEGER REFERENCES trades(id),
  position_id INTEGER REFERENCES positions(id),
  thesis TEXT,
  analysis TEXT,
  grade TEXT CHECK(grade IN ('A', 'B', 'C', 'D', 'F')),
  emotion TEXT,
  lessons_learned TEXT,
  screenshots TEXT, -- JSON array of paths
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Watchlist
CREATE TABLE IF NOT EXISTS watchlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER REFERENCES accounts(id),
  symbol TEXT NOT NULL,
  underlying TEXT NOT NULL,
  target_strategy TEXT,
  target_entry REAL,
  iv_rank REAL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Market data cache
CREATE TABLE IF NOT EXISTS market_data (
  symbol TEXT PRIMARY KEY,
  price REAL,
  change REAL,
  change_percent REAL,
  volume INTEGER,
  iv REAL,
  iv_rank REAL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Portfolio snapshots for historical tracking
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  snapshot_date DATE NOT NULL,
  total_value REAL NOT NULL,
  cash_balance REAL NOT NULL,
  positions_value REAL NOT NULL,
  day_pnl REAL DEFAULT 0,
  total_pnl REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_positions_account ON positions(account_id);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_underlying ON positions(underlying);
CREATE INDEX IF NOT EXISTS idx_trades_position ON trades(position_id);
CREATE INDEX IF NOT EXISTS idx_journal_position ON journal_entries(position_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_account_date ON portfolio_snapshots(account_id, snapshot_date);

-- Insert default paper trading account with $10,000
INSERT OR IGNORE INTO accounts (id, name, type, starting_balance, current_balance)
VALUES (1, 'Paper Trading', 'paper', 10000.00, 10000.00);
