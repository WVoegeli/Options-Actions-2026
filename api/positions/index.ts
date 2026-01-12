import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initDb } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();

    if (req.method === 'GET') {
      const status = req.query.status as string | undefined;

      let result;
      if (status) {
        result = await sql`
          SELECT * FROM positions
          WHERE status = ${status}
          ORDER BY opened_at DESC
        `;
      } else {
        result = await sql`SELECT * FROM positions ORDER BY opened_at DESC`;
      }

      return res.status(200).json(result.rows.map(row => ({
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
        notes: row.notes
      })));
    }

    if (req.method === 'POST') {
      const {
        accountId = 1,
        symbol,
        underlying,
        optionType,
        strike,
        expiration,
        quantity,
        avgCost,
        strategyTag,
        notes
      } = req.body;

      const result = await sql`
        INSERT INTO positions (
          account_id, symbol, underlying, option_type, strike, expiration,
          quantity, avg_cost, strategy_tag, notes
        )
        VALUES (
          ${accountId}, ${symbol}, ${underlying}, ${optionType}, ${strike},
          ${expiration}, ${quantity}, ${avgCost}, ${strategyTag}, ${notes}
        )
        RETURNING *
      `;

      // Create opening trade
      await sql`
        INSERT INTO trades (position_id, action, quantity, price)
        VALUES (${result.rows[0].id}, 'open', ${quantity}, ${avgCost})
      `;

      return res.status(201).json(result.rows[0]);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Positions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
