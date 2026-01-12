import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initDb } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();

    if (req.method === 'GET') {
      const result = await sql`SELECT * FROM accounts ORDER BY id`;
      return res.status(200).json(result.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        startingBalance: row.starting_balance,
        currentBalance: row.current_balance,
        createdAt: row.created_at
      })));
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Accounts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
