import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initDb } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();

    if (req.method === 'GET') {
      // Get closed positions for analytics
      const positions = await sql`
        SELECT * FROM positions WHERE status IN ('closed', 'expired', 'assigned')
      `;

      const closedPositions = positions.rows;
      const totalTrades = closedPositions.length;

      if (totalTrades === 0) {
        return res.status(200).json({
          totalTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          avgWin: 0,
          avgLoss: 0,
          profitFactor: 0,
          largestWin: 0,
          largestLoss: 0,
          totalPnl: 0,
          byStrategy: []
        });
      }

      const wins = closedPositions.filter(p => p.pnl > 0);
      const losses = closedPositions.filter(p => p.pnl < 0);

      const totalPnl = closedPositions.reduce((sum, p) => sum + (p.pnl || 0), 0);
      const totalWins = wins.reduce((sum, p) => sum + p.pnl, 0);
      const totalLosses = Math.abs(losses.reduce((sum, p) => sum + p.pnl, 0));

      // Group by strategy
      const strategyMap = new Map();
      closedPositions.forEach(p => {
        const strategy = p.strategy_tag || 'other';
        if (!strategyMap.has(strategy)) {
          strategyMap.set(strategy, { trades: [], totalPnl: 0 });
        }
        strategyMap.get(strategy).trades.push(p);
        strategyMap.get(strategy).totalPnl += p.pnl || 0;
      });

      const byStrategy = Array.from(strategyMap.entries()).map(([strategy, data]) => ({
        strategy,
        totalTrades: data.trades.length,
        winRate: data.trades.filter((t: any) => t.pnl > 0).length / data.trades.length * 100,
        totalPnl: data.totalPnl,
        avgReturn: data.totalPnl / data.trades.length
      }));

      return res.status(200).json({
        totalTrades,
        winningTrades: wins.length,
        losingTrades: losses.length,
        winRate: (wins.length / totalTrades) * 100,
        avgWin: wins.length > 0 ? totalWins / wins.length : 0,
        avgLoss: losses.length > 0 ? totalLosses / losses.length : 0,
        profitFactor: totalLosses > 0 ? totalWins / totalLosses : totalWins,
        largestWin: wins.length > 0 ? Math.max(...wins.map(p => p.pnl)) : 0,
        largestLoss: losses.length > 0 ? Math.min(...losses.map(p => p.pnl)) : 0,
        totalPnl,
        byStrategy
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
