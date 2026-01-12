import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql, initDb } from '../_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await initDb();

    if (req.method === 'GET') {
      const result = await sql`
        SELECT je.*, p.symbol, p.underlying
        FROM journal_entries je
        LEFT JOIN positions p ON je.position_id = p.id
        ORDER BY je.created_at DESC
      `;

      return res.status(200).json(result.rows.map(row => ({
        id: row.id,
        tradeId: row.trade_id,
        positionId: row.position_id,
        thesis: row.thesis,
        analysis: row.analysis,
        grade: row.grade,
        emotion: row.emotion,
        lessonsLearned: row.lessons_learned,
        screenshots: row.screenshots ? JSON.parse(row.screenshots) : [],
        createdAt: row.created_at,
        symbol: row.symbol,
        underlying: row.underlying
      })));
    }

    if (req.method === 'POST') {
      const { positionId, tradeId, thesis, analysis, grade, emotion, lessonsLearned } = req.body;

      const result = await sql`
        INSERT INTO journal_entries (position_id, trade_id, thesis, analysis, grade, emotion, lessons_learned)
        VALUES (${positionId}, ${tradeId}, ${thesis}, ${analysis}, ${grade}, ${emotion}, ${lessonsLearned})
        RETURNING *
      `;

      return res.status(201).json(result.rows[0]);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Journal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
