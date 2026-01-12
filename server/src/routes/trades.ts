import { Router } from 'express';
import { tradeQueries } from '../db/database.js';

const router = Router();

// Get trades for a position
router.get('/position/:positionId', (req, res) => {
  try {
    const trades = tradeQueries.getByPosition(parseInt(req.params.positionId));
    res.json(trades);
  } catch (error) {
    console.error('Get trades error:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Create a trade (adjustment, roll, etc.)
router.post('/', (req, res) => {
  try {
    const { position_id, action, quantity, price, commission = 0, notes } = req.body;

    if (!position_id || !action || !quantity || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = tradeQueries.create(
      position_id,
      action,
      quantity,
      price,
      commission,
      notes || null
    );

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    console.error('Create trade error:', error);
    res.status(500).json({ error: 'Failed to create trade' });
  }
});

export default router;
