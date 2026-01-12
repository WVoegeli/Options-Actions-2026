# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Options-Actions-2026 is a full-stack options trading dashboard and portfolio management application. It enables paper trading with a $10,000 starting account, position tracking, trade journaling, and performance analytics.

**Tech Stack:**
- Frontend: React 18, TypeScript, Vite, TailwindCSS, Recharts
- Backend: Node.js/Express, TypeScript, SQL.js (embedded SQLite)
- Market Data: yahoo-finance2 API

## Commands

### Frontend (client/)
```bash
npm run dev      # Development server on port 3000 (proxies /api to :3001)
npm run build    # Production build to dist/
npm run lint     # ESLint check
```

### Backend (server/)
```bash
npm run dev      # Development with tsx watch on port 3001
npm run build    # Compile TypeScript to dist/
npm start        # Run production build
```

### Health Check
`GET /api/health` - Server health endpoint

## Architecture

### Client Structure
```
client/src/
├── components/
│   ├── Dashboard/      # Main dashboard with portfolio metrics
│   ├── Positions/      # Position management (NewPositionModal is ~16KB)
│   ├── Journal/        # Trade journaling with grades
│   ├── Analytics/      # Performance charts and statistics
│   ├── Strategies/     # Strategy documentation
│   ├── Education/      # Educational resources
│   └── common/         # Layout, Sidebar, Header
├── services/api.ts     # Axios client for all API calls
└── types/index.ts      # All TypeScript interfaces
```

### Server Structure
```
server/src/
├── routes/
│   ├── accounts.ts     # Account CRUD
│   ├── positions.ts    # Position management
│   ├── trades.ts       # Trade execution
│   ├── journal.ts      # Journal entries
│   ├── analytics.ts    # Performance analytics
│   └── marketData.ts   # Yahoo Finance integration
├── services/greeks.ts  # Black-Scholes pricing & Greeks calculator
└── db/
    ├── database.ts     # SQL.js wrapper with query builders
    └── schema.sql      # Database schema (7 tables)
```

### Data Flow
1. Frontend makes requests via Axios (`services/api.ts`)
2. Vite dev server proxies `/api/*` to Express on port 3001
3. Express routes handle business logic
4. `database.ts` executes SQL against SQL.js
5. JSON responses returned to client

### Key Database Tables
- **accounts** - Paper/live trading accounts
- **positions** - Options positions with strategy tags
- **trades** - Individual trade executions
- **journal_entries** - Trade journaling with grades/emotions
- **portfolio_snapshots** - Historical P&L tracking

### Strategy Tags
`wheel-csp`, `wheel-cc`, `pmcc`, `bull-put-spread`, `bear-call-spread`, `iron-condor`, `long-call`, `long-put`, `other`

## Key Implementation Details

### Greeks Calculator (server/src/services/greeks.ts)
Black-Scholes implementation for:
- Option pricing (calls/puts)
- Greeks: Delta, Gamma, Theta, Vega, Rho
- Implied Volatility (Newton-Raphson method)
- Probability of Profit calculations

### Default Account
Account ID 1 is the default paper trading account with $10,000 starting balance. Most API calls use this account implicitly.

### UI Theme
Dark mode trading interface with:
- Green (#10B981) for profit/positive values
- Red (#EF4444) for loss/negative values
