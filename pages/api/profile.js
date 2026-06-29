import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import clientPromise from '../../lib/mongodb';

// Profile holds per-exercise working weights (auto-progressed from sessions)
// and a body-weight log.
export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });

    const client = await clientPromise;
    const db = client.db('training');
    const col = db.collection('profiles');
    const userId = session.user.id || session.user.email;

    if (req.method === 'GET') {
      const p = await col.findOne({ userId });
      return res.status(200).json(p || { userId, workingWeights: {}, bodyWeight: null, bodyHistory: [] });
    }

    if (req.method === 'POST') {
      const { workingWeights, bodyWeight } = req.body || {};
      const $set = { updatedAt: new Date() };
      const ops = { $set };

      if (workingWeights && typeof workingWeights === 'object') {
        for (const [k, v] of Object.entries(workingWeights)) {
          const n = Number(v);
          if (!Number.isNaN(n) && n > 0) $set[`workingWeights.${k}`] = n;
        }
      }
      if (bodyWeight != null && bodyWeight !== '' && !Number.isNaN(Number(bodyWeight))) {
        $set.bodyWeight = Number(bodyWeight);
        ops.$push = { bodyHistory: { weight: Number(bodyWeight), date: new Date() } };
      }

      await col.updateOne({ userId }, ops, { upsert: true });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      await col.deleteOne({ userId });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (err) {
    console.error('[api/profile] failed:', err);
    return res.status(500).json({ error: `Serverfehler: ${err?.message || 'unbekannt'}` });
  }
}
