import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './db/database.js';
import accountRoutes from './routes/accounts.js';
import positionRoutes from './routes/positions.js';
import tradeRoutes from './routes/trades.js';
import journalRoutes from './routes/journal.js';
import analyticsRoutes from './routes/analytics.js';
import marketDataRoutes from './routes/marketData.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database first
    await initializeDatabase();

    // Routes (after DB is ready)
    app.use('/api/accounts', accountRoutes);
    app.use('/api/positions', positionRoutes);
    app.use('/api/trades', tradeRoutes);
    app.use('/api/journal', journalRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/market', marketDataRoutes);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('Options Trading API ready');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
