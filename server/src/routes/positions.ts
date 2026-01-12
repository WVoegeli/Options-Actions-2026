import { Router } from 'express';
import { positionQueries, tradeQueries } from '../db/database.js';

const router = Router();

// Get all positions for an account
router.get('/', (req, res) => {
  try {
    const accountId = parseInt(req.query.account_id as string) || 1;
    const status = req.query.status;

    let positions;
    if (status === 'open') {
      positions = positionQueries.getOpen(accountId);
    } else {
      positions = positionQueries.getAll(accountId);
    }

    res.json(positions);
  } catch (error) {
    console.error('Get positions error:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// Get position by ID
router.get('/:id', (req, res) => {
  try {
    const position = positionQueries.getById(parseInt(req.params.id));
    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }

    // Get associated trades
    const trades = tradeQueries.getByPosition(parseInt(req.params.id));

    res.json({ ...position, trades });
  } catch (error) {
    console.error('Get position error:', error);
    res.status(500).json({ error: 'Failed to fetch position' });
  }
});

// Create new position
router.post('/', (req, res) => {
  try {
    const {
      account_id = 1,
      symbol,
      underlying,
      option_type,
      strike,
      expiration,
      quantity,
      price,
      strategy_tag,
      notes,
    } = req.body;

    // Validate required fields
    if (!symbol || !underlying || !option_type || !quantity || price === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create position
    const result = positionQueries.create(
      account_id,
      symbol,
      underlying,
      option_type,
      strike || null,
      expiration || null,
      quantity,
      price,
      strategy_tag || 'other',
      notes || null
    );

    // Create opening trade
    tradeQueries.create(
      result.lastInsertRowid as number,
      'open',
      quantity,
      price,
      0, // commission
      notes || null
    );

    const newPosition = positionQueries.getById(result.lastInsertRowid as number);
    res.status(201).json(newPosition);
  } catch (error) {
    console.error('Create position error:', error);
    res.status(500).json({ error: 'Failed to create position' });
  }
});

// Update position price (for P&L calculation)
router.patch('/:id/price', (req, res) => {
  try {
    const { current_price } = req.body;
    if (current_price === undefined) {
      return res.status(400).json({ error: 'current_price required' });
    }

    positionQueries.updatePrice(current_price, parseInt(req.params.id));
    const position = positionQueries.getById(parseInt(req.params.id));
    res.json(position);
  } catch (error) {
    console.error('Update price error:', error);
    res.status(500).json({ error: 'Failed to update price' });
  }
});

// Close position
router.post('/:id/close', (req, res) => {
  try {
    const { close_price, status = 'closed', notes } = req.body;
    if (close_price === undefined) {
      return res.status(400).json({ error: 'close_price required' });
    }

    const position = positionQueries.getById(parseInt(req.params.id));
    if (!position) {
      return res.status(404).json({ error: 'Position not found' });
    }

    // Close the position
    positionQueries.close(status, close_price, parseInt(req.params.id));

    // Create closing trade
    tradeQueries.create(
      parseInt(req.params.id),
      'close',
      -position.quantity,
      close_price,
      0,
      notes || null
    );

    const closedPosition = positionQueries.getById(parseInt(req.params.id));
    res.json(closedPosition);
  } catch (error) {
    console.error('Close position error:', error);
    res.status(500).json({ error: 'Failed to close position' });
  }
});

export default router;
