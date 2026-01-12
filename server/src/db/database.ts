import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db: SqlJsDatabase;
const dbPath = join(__dirname, '../../data/options.db');

// Ensure data directory exists
const dataDir = dirname(dbPath);
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Initialize database
export async function initializeDatabase(): Promise<void> {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (existsSync(dbPath)) {
    const fileBuffer = readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Initialize schema
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Execute each statement separately
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      db.run(statement);
    } catch (error) {
      // Ignore "table already exists" errors
      if (!(error instanceof Error && error.message.includes('already exists'))) {
        console.error('Schema error:', error);
      }
    }
  }

  // Save to disk
  saveDatabase();
  console.log('Database initialized successfully');
}

// Save database to disk
function saveDatabase(): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(dbPath, buffer);
}

// Helper to run queries and save
function runAndSave(sql: string, params: any[] = []): any {
  const result = db.run(sql, params);
  saveDatabase();
  return result;
}

// Account queries
export const accountQueries = {
  getAll: () => db.exec('SELECT * FROM accounts')[0]?.values.map(rowToAccount) || [],
  getById: (id: number) => {
    const result = db.exec('SELECT * FROM accounts WHERE id = ?', [id]);
    return result[0]?.values[0] ? rowToAccount(result[0].values[0]) : null;
  },
  updateBalance: (balance: number, id: number) => {
    runAndSave('UPDATE accounts SET current_balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [balance, id]);
  },
};

// Position queries
export const positionQueries = {
  getAll: (accountId: number) => {
    const result = db.exec('SELECT * FROM positions WHERE account_id = ?', [accountId]);
    return result[0]?.values.map(rowToPosition) || [];
  },
  getOpen: (accountId: number) => {
    const result = db.exec('SELECT * FROM positions WHERE account_id = ? AND status = "open"', [accountId]);
    return result[0]?.values.map(rowToPosition) || [];
  },
  getById: (id: number) => {
    const result = db.exec('SELECT * FROM positions WHERE id = ?', [id]);
    return result[0]?.values[0] ? rowToPosition(result[0].values[0]) : null;
  },
  create: (accountId: number, symbol: string, underlying: string, optionType: string, strike: number | null, expiration: string | null, quantity: number, avgCost: number, strategyTag: string, notes: string | null) => {
    runAndSave(`
      INSERT INTO positions (account_id, symbol, underlying, option_type, strike, expiration, quantity, avg_cost, strategy_tag, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [accountId, symbol, underlying, optionType, strike, expiration, quantity, avgCost, strategyTag, notes]);
    const result = db.exec('SELECT last_insert_rowid()');
    return { lastInsertRowid: result[0]?.values[0]?.[0] };
  },
  updatePrice: (currentPrice: number, id: number) => {
    runAndSave('UPDATE positions SET current_price = ?, pnl = (? - avg_cost) * quantity * 100 WHERE id = ?', [currentPrice, currentPrice, id]);
  },
  close: (status: string, closePrice: number, id: number) => {
    runAndSave(`
      UPDATE positions
      SET status = ?, closed_at = CURRENT_TIMESTAMP, close_price = ?,
          pnl = (? - avg_cost) * quantity * 100 * (CASE WHEN quantity < 0 THEN -1 ELSE 1 END)
      WHERE id = ?
    `, [status, closePrice, closePrice, id]);
  },
};

// Trade queries
export const tradeQueries = {
  getByPosition: (positionId: number) => {
    const result = db.exec('SELECT * FROM trades WHERE position_id = ? ORDER BY executed_at DESC', [positionId]);
    return result[0]?.values.map(rowToTrade) || [];
  },
  create: (positionId: number, action: string, quantity: number, price: number, commission: number, notes: string | null) => {
    runAndSave(`
      INSERT INTO trades (position_id, action, quantity, price, commission, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [positionId, action, quantity, price, commission, notes]);
    const result = db.exec('SELECT last_insert_rowid()');
    return { lastInsertRowid: result[0]?.values[0]?.[0] };
  },
};

// Journal queries
export const journalQueries = {
  getAll: () => {
    const result = db.exec(`
      SELECT j.*, p.symbol, p.underlying, p.strategy_tag
      FROM journal_entries j
      LEFT JOIN positions p ON j.position_id = p.id
      ORDER BY j.created_at DESC
    `);
    return result[0]?.values.map(rowToJournalEntry) || [];
  },
  getByPosition: (positionId: number) => {
    const result = db.exec('SELECT * FROM journal_entries WHERE position_id = ?', [positionId]);
    return result[0]?.values[0] ? rowToJournalEntry(result[0].values[0]) : null;
  },
  create: (tradeId: number | null, positionId: number, thesis: string | null, analysis: string | null, grade: string | null, emotion: string | null, lessonsLearned: string | null) => {
    runAndSave(`
      INSERT INTO journal_entries (trade_id, position_id, thesis, analysis, grade, emotion, lessons_learned)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [tradeId, positionId, thesis, analysis, grade, emotion, lessonsLearned]);
    const result = db.exec('SELECT last_insert_rowid()');
    return { lastInsertRowid: result[0]?.values[0]?.[0] };
  },
  update: (thesis: string | null, analysis: string | null, grade: string | null, emotion: string | null, lessonsLearned: string | null, id: number) => {
    runAndSave(`
      UPDATE journal_entries
      SET thesis = ?, analysis = ?, grade = ?, emotion = ?, lessons_learned = ?
      WHERE id = ?
    `, [thesis, analysis, grade, emotion, lessonsLearned, id]);
  },
};

// Watchlist queries
export const watchlistQueries = {
  getAll: (accountId: number) => {
    const result = db.exec('SELECT * FROM watchlist WHERE account_id = ? ORDER BY created_at DESC', [accountId]);
    return result[0]?.values || [];
  },
  create: (accountId: number, symbol: string, underlying: string, targetStrategy: string | null, targetEntry: number | null, notes: string | null) => {
    runAndSave(`
      INSERT INTO watchlist (account_id, symbol, underlying, target_strategy, target_entry, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [accountId, symbol, underlying, targetStrategy, targetEntry, notes]);
  },
  delete: (id: number) => {
    runAndSave('DELETE FROM watchlist WHERE id = ?', [id]);
  },
};

// Portfolio snapshot queries
export const snapshotQueries = {
  getRecent: (accountId: number, limit: number) => {
    const result = db.exec(`
      SELECT * FROM portfolio_snapshots
      WHERE account_id = ?
      ORDER BY snapshot_date DESC
      LIMIT ?
    `, [accountId, limit]);
    return result[0]?.values || [];
  },
  create: (accountId: number, snapshotDate: string, totalValue: number, cashBalance: number, positionsValue: number, dayPnl: number, totalPnl: number) => {
    runAndSave(`
      INSERT INTO portfolio_snapshots (account_id, snapshot_date, total_value, cash_balance, positions_value, day_pnl, total_pnl)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [accountId, snapshotDate, totalValue, cashBalance, positionsValue, dayPnl, totalPnl]);
  },
};

// Analytics queries
export const analyticsQueries = {
  getStrategyStats: (accountId: number) => {
    const result = db.exec(`
      SELECT
        strategy_tag,
        COUNT(*) as total_trades,
        SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
        SUM(CASE WHEN pnl <= 0 THEN 1 ELSE 0 END) as losing_trades,
        AVG(pnl) as avg_pnl,
        SUM(pnl) as total_pnl
      FROM positions
      WHERE account_id = ? AND status IN ('closed', 'expired', 'assigned')
      GROUP BY strategy_tag
    `, [accountId]);
    return result[0]?.values.map(row => ({
      strategy_tag: row[0],
      total_trades: row[1],
      winning_trades: row[2],
      losing_trades: row[3],
      avg_pnl: row[4],
      total_pnl: row[5],
    })) || [];
  },
  getTotalStats: (accountId: number) => {
    const result = db.exec(`
      SELECT
        COUNT(*) as total_trades,
        SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) as winning_trades,
        SUM(pnl) as total_pnl,
        MAX(pnl) as largest_win,
        MIN(pnl) as largest_loss,
        AVG(CASE WHEN pnl > 0 THEN pnl END) as avg_win,
        AVG(CASE WHEN pnl <= 0 THEN pnl END) as avg_loss
      FROM positions
      WHERE account_id = ? AND status IN ('closed', 'expired', 'assigned')
    `, [accountId]);
    if (result[0]?.values[0]) {
      const row = result[0].values[0];
      return {
        total_trades: row[0] || 0,
        winning_trades: row[1] || 0,
        total_pnl: row[2] || 0,
        largest_win: row[3] || 0,
        largest_loss: row[4] || 0,
        avg_win: row[5] || 0,
        avg_loss: row[6] || 0,
      };
    }
    return {
      total_trades: 0,
      winning_trades: 0,
      total_pnl: 0,
      largest_win: 0,
      largest_loss: 0,
      avg_win: 0,
      avg_loss: 0,
    };
  },
};

// Row to object converters
function rowToAccount(row: any[]): any {
  return {
    id: row[0],
    name: row[1],
    type: row[2],
    starting_balance: row[3],
    current_balance: row[4],
    created_at: row[5],
    updated_at: row[6],
  };
}

function rowToPosition(row: any[]): any {
  return {
    id: row[0],
    account_id: row[1],
    symbol: row[2],
    underlying: row[3],
    option_type: row[4],
    strike: row[5],
    expiration: row[6],
    quantity: row[7],
    avg_cost: row[8],
    current_price: row[9],
    strategy_tag: row[10],
    status: row[11],
    opened_at: row[12],
    closed_at: row[13],
    close_price: row[14],
    pnl: row[15],
    notes: row[16],
  };
}

function rowToTrade(row: any[]): any {
  return {
    id: row[0],
    position_id: row[1],
    action: row[2],
    quantity: row[3],
    price: row[4],
    commission: row[5],
    executed_at: row[6],
    notes: row[7],
  };
}

function rowToJournalEntry(row: any[]): any {
  return {
    id: row[0],
    trade_id: row[1],
    position_id: row[2],
    thesis: row[3],
    analysis: row[4],
    grade: row[5],
    emotion: row[6],
    lessons_learned: row[7],
    screenshots: row[8],
    created_at: row[9],
    // Joined fields if present
    symbol: row[10],
    underlying: row[11],
    strategy_tag: row[12],
  };
}

export default db;
