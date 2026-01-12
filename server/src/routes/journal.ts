import { Router } from 'express';
import { journalQueries } from '../db/database.js';

const router = Router();

// Get all journal entries
router.get('/', (req, res) => {
  try {
    const entries = journalQueries.getAll();
    res.json(entries);
  } catch (error) {
    console.error('Get journal entries error:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// Get journal entry for a position
router.get('/position/:positionId', (req, res) => {
  try {
    const entry = journalQueries.getByPosition(parseInt(req.params.positionId));
    res.json(entry || null);
  } catch (error) {
    console.error('Get journal entry error:', error);
    res.status(500).json({ error: 'Failed to fetch journal entry' });
  }
});

// Create journal entry
router.post('/', (req, res) => {
  try {
    const {
      trade_id,
      position_id,
      thesis,
      analysis,
      grade,
      emotion,
      lessons_learned,
    } = req.body;

    if (!position_id) {
      return res.status(400).json({ error: 'position_id required' });
    }

    const result = journalQueries.create(
      trade_id || null,
      position_id,
      thesis || null,
      analysis || null,
      grade || null,
      emotion || null,
      lessons_learned || null
    );

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    console.error('Create journal entry error:', error);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

// Update journal entry
router.put('/:id', (req, res) => {
  try {
    const { thesis, analysis, grade, emotion, lessons_learned } = req.body;

    journalQueries.update(
      thesis || null,
      analysis || null,
      grade || null,
      emotion || null,
      lessons_learned || null,
      parseInt(req.params.id)
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Update journal entry error:', error);
    res.status(500).json({ error: 'Failed to update journal entry' });
  }
});

export default router;
