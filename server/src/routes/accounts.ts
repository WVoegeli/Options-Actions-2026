import { Router } from 'express';
import { accountQueries, positionQueries, snapshotQueries } from '../db/database.js';

const router = Router();

// Get all accounts
router.get('/', (req, res) => {
  try {
    const accounts = accountQueries.getAll();
    res.json(accounts);
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Get account by ID with summary
router.get('/:id', (req, res) => {
  try {
    const account = accountQueries.getById(parseInt(req.params.id));
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Get open positions
    const positions = positionQueries.getOpen(parseInt(req.params.id));

    // Calculate portfolio metrics
    const positionsValue = positions.reduce((sum: number, p: any) => {
      const value = (p.current_price || 0) * Math.abs(p.quantity) * 100;
      return sum + value;
    }, 0);

    const unrealizedPnl = positions.reduce((sum: number, p: any) => sum + (p.pnl || 0), 0);

    const summary = {
      ...account,
      positions_count: positions.length,
      positions_value: positionsValue,
      unrealized_pnl: unrealizedPnl,
      total_value: account.current_balance + positionsValue,
    };

    res.json(summary);
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// Get portfolio history
router.get('/:id/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 30;
    const snapshots = snapshotQueries.getRecent(parseInt(req.params.id), limit);
    res.json(snapshots);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
