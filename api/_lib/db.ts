import { sql } from '@vercel/postgres';

// Initialize database schema
export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('paper', 'live')) NOT NULL,
      starting_balance REAL NOT NULL,
      current_balance REAL NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS positions (
      id SERIAL PRIMARY KEY,
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
      opened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      closed_at TIMESTAMP,
      close_price REAL,
      pnl REAL DEFAULT 0,
      notes TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      position_id INTEGER NOT NULL REFERENCES positions(id),
      action TEXT CHECK(action IN ('open', 'close', 'roll', 'adjust')) NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      commission REAL DEFAULT 0,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notes TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id SERIAL PRIMARY KEY,
      trade_id INTEGER REFERENCES trades(id),
      position_id INTEGER REFERENCES positions(id),
      thesis TEXT,
      analysis TEXT,
      grade TEXT CHECK(grade IN ('A', 'B', 'C', 'D', 'F')),
      emotion TEXT,
      lessons_learned TEXT,
      screenshots TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      id SERIAL PRIMARY KEY,
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      snapshot_date DATE NOT NULL,
      total_value REAL NOT NULL,
      cash_balance REAL NOT NULL,
      positions_value REAL NOT NULL,
      day_pnl REAL DEFAULT 0,
      total_pnl REAL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Insert default paper trading account if not exists
  const existing = await sql`SELECT id FROM accounts WHERE id = 1`;
  if (existing.rows.length === 0) {
    await sql`
      INSERT INTO accounts (id, name, type, starting_balance, current_balance)
      VALUES (1, 'Paper Trading', 'paper', 10000.00, 10000.00)
    `;
  }
}

export { sql };
