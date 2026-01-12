import { Router } from 'express';
import { analyticsQueries } from '../db/database.js';

const router = Router();

// Get overall analytics
router.get('/', (req, res) => {
  try {
    const accountId = parseInt(req.query.account_id as string) || 1;

    const strategyStats = analyticsQueries.getStrategyStats(accountId);
    const totalStats = analyticsQueries.getTotalStats(accountId);

    // Calculate win rate
    const winRate = totalStats.total_trades > 0
      ? (totalStats.winning_trades / totalStats.total_trades) * 100
      : 0;

    // Calculate profit factor
    const profitFactor = totalStats.avg_loss && totalStats.avg_loss < 0
      ? Math.abs((totalStats.avg_win || 0) / totalStats.avg_loss)
      : 0;

    res.json({
      overall: {
        total_trades: totalStats.total_trades || 0,
        winning_trades: totalStats.winning_trades || 0,
        losing_trades: (totalStats.total_trades || 0) - (totalStats.winning_trades || 0),
        win_rate: winRate,
        total_pnl: totalStats.total_pnl || 0,
        largest_win: totalStats.largest_win || 0,
        largest_loss: totalStats.largest_loss || 0,
        avg_win: totalStats.avg_win || 0,
        avg_loss: totalStats.avg_loss || 0,
        profit_factor: profitFactor,
      },
      by_strategy: strategyStats.map(s => ({
        strategy: s.strategy_tag,
        total_trades: s.total_trades,
        winning_trades: s.winning_trades,
        win_rate: s.total_trades > 0 ? ((s.winning_trades as number) / (s.total_trades as number)) * 100 : 0,
        avg_pnl: s.avg_pnl,
        total_pnl: s.total_pnl,
      })),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
