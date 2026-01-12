import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initDb } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();
    const { id } = req.query;
    const accountId = parseInt(id as string);

    if (req.method === 'GET') {
      const account = await sql`SELECT * FROM accounts WHERE id = ${accountId}`;
      if (account.rows.length === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }

      const positions = await sql`
        SELECT * FROM positions
        WHERE account_id = ${accountId} AND status = 'open'
      `;

      const positionsValue = positions.rows.reduce((sum, p) => {
        return sum + (p.current_price * p.quantity * 100);
      }, 0);

      const row = account.rows[0];
      return res.status(200).json({
        id: row.id,
        name: row.name,
        type: row.type,
        startingBalance: row.starting_balance,
        currentBalance: row.current_balance,
        createdAt: row.created_at,
        portfolioValue: row.current_balance + positionsValue,
        positionsValue,
        openPositions: positions.rows.length
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
