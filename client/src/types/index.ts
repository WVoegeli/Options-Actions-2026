// Account Types
export interface Account {
  id: number;
  name: string;
  type: 'paper' | 'live';
  startingBalance: number;
  currentBalance: number;
  createdAt: string;
}

// Position Types
export type OptionType = 'call' | 'put' | 'stock';
export type PositionStatus = 'open' | 'closed' | 'assigned' | 'expired';
export type StrategyTag =
  | 'wheel-csp'
  | 'wheel-cc'
  | 'pmcc'
  | 'bull-put-spread'
  | 'bear-call-spread'
  | 'iron-condor'
  | 'long-call'
  | 'long-put'
  | 'other';

export interface Position {
  id: number;
  accountId: number;
  symbol: string;
  underlying: string;
  optionType: OptionType;
  strike: number | null;
  expiration: string | null;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  strategyTag: StrategyTag;
  status: PositionStatus;
  openedAt: string;
  closedAt: string | null;
  closePrice: number | null;
  pnl: number;
  pnlPercent: number;
  // Greeks
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  iv: number;
  dte: number; // Days to expiration
}

// Trade Types
export type TradeAction = 'open' | 'close' | 'roll' | 'adjust';

export interface Trade {
  id: number;
  positionId: number;
  action: TradeAction;
  quantity: number;
  price: number;
  commission: number;
  executedAt: string;
  notes: string | null;
}

// Journal Types
export type TradeGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface JournalEntry {
  id: number;
  tradeId: number;
  thesis: string;
  analysis: string;
  grade: TradeGrade;
  emotion: string;
  lessonsLearned: string;
  screenshots: string[];
  createdAt: string;
}

// Watchlist Types
export interface WatchlistItem {
  id: number;
  symbol: string;
  targetStrategy: StrategyTag;
  targetEntry: number;
  ivRank: number;
  notes: string;
  createdAt: string;
}

// Market Data Types
export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  iv: number;
  ivRank: number;
  updatedAt: string;
}

// Greeks Summary
export interface GreeksSummary {
  totalDelta: number;
  totalGamma: number;
  totalTheta: number;
  totalVega: number;
  netExposure: number; // Dollar exposure
}

// Portfolio Summary
export interface PortfolioSummary {
  totalValue: number;
  dayPnl: number;
  dayPnlPercent: number;
  totalPnl: number;
  totalPnlPercent: number;
  openPositions: number;
  cashAvailable: number;
  buyingPower: number;
  greeks: GreeksSummary;
}

// Analytics Types
export interface StrategyPerformance {
  strategy: StrategyTag;
  totalTrades: number;
  winRate: number;
  avgReturn: number;
  totalPnl: number;
  avgDaysHeld: number;
}

export interface TradeAnalytics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  totalPnl: number;
  byStrategy: StrategyPerformance[];
}

// Option Chain Types
export interface OptionContract {
  symbol: string;
  strike: number;
  expiration: string;
  type: 'call' | 'put';
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  iv: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

export interface OptionChain {
  underlying: string;
  underlyingPrice: number;
  expirations: string[];
  calls: OptionContract[];
  puts: OptionContract[];
}
