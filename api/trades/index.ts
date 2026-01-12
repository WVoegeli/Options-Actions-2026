import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initDb } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();

    if (req.method === 'POST') {
      const { positionId, action, quantity, price, commission = 0, notes } = req.body;

      const result = await sql`
        INSERT INTO trades (position_id, action, quantity, price, commission, notes)
        VALUES (${positionId}, ${action}, ${quantity}, ${price}, ${commission}, ${notes})
        RETURNING *
      `;

      return res.status(201).json(result.rows[0]);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Trades error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
