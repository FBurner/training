import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });

    const client = await clientPromise;
    const db = client.db('training');
    const userId = session.user.id || session.user.email;

    if (req.method === 'POST') {
      const { day, exercises, totalSets, doneSets, durationMinutes } = req.body;
      await db.collection('sessions').insertOne({
        userId, day, exercises, totalSets, doneSets, durationMinutes,
        completedAt: new Date(),
      });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'GET') {
      const { day, limit = 30 } = req.query;
      const filter = { userId, ...(day ? { day } : {}) };
      const sessions = await db.collection('sessions')
        .find(filter).sort({ completedAt: -1 }).limit(parseInt(limit)).toArray();
      return res.status(200).json(sessions);
    }

    return res.status(405).end();
  } catch (err) {
    console.error('[api/sessions] failed:', err);
    return res.status(500).json({ error: `Serverfehler: ${err?.message || 'unbekannt'}` });
  }
}
