import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initDb } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();
    const { id } = req.query;
    const positionId = parseInt(id as string);

    if (req.method === 'GET') {
      const position = await sql`SELECT * FROM positions WHERE id = ${positionId}`;
      if (position.rows.length === 0) {
        return res.status(404).json({ error: 'Position not found' });
      }

      const trades = await sql`
        SELECT * FROM trades WHERE position_id = ${positionId} ORDER BY executed_at
      `;

      const row = position.rows[0];
      return res.status(200).json({
        id: row.id,
        accountId: row.account_id,
        symbol: row.symbol,
        underlying: row.underlying,
        optionType: row.option_type,
        strike: row.strike,
        expiration: row.expiration,
        quantity: row.quantity,
        avgCost: row.avg_cost,
        currentPrice: row.current_price,
        strategyTag: row.strategy_tag,
        status: row.status,
        openedAt: row.opened_at,
        closedAt: row.closed_at,
        closePrice: row.close_price,
        pnl: row.pnl,
        trades: trades.rows
      });
    }

    if (req.method === 'PATCH') {
      const { currentPrice } = req.body;
      await sql`
        UPDATE positions SET current_price = ${currentPrice} WHERE id = ${positionId}
      `;
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Position error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
