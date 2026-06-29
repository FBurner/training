import { getServerSession } from 'next-auth';
import { ObjectId } from 'mongodb';
import { authOptions } from './auth/[...nextauth]';
import clientPromise from '../../lib/mongodb';

// A session has status 'active' (in progress, resumable) or 'completed'.
// There is at most one active session per (user, day); it is upserted on
// every set change and flipped to 'completed' when the workout is saved.
export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: 'Unauthorized' });

    const client = await clientPromise;
    const db = client.db('training');
    const col = db.collection('sessions');
    const userId = session.user.id || session.user.email;

    if (req.method === 'POST') {
      const { day, exercises, totalSets, doneSets, completedSets, status } = req.body || {};
      if (!day) return res.status(400).json({ error: 'day fehlt' });

      const isComplete = status === 'completed';
      await col.updateOne(
        { userId, day, status: 'active' },
        {
          $set: {
            userId, day, exercises, totalSets, doneSets,
            completedSets: completedSets || {},
            status: isComplete ? 'completed' : 'active',
            updatedAt: new Date(),
            ...(isComplete ? { completedAt: new Date() } : {}),
          },
          $setOnInsert: { startedAt: new Date() },
        },
        { upsert: true },
      );
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'GET') {
      const { status, day, limit = 30 } = req.query;

      if (status === 'active') {
        const active = await col.find({ userId, status: 'active', ...(day ? { day } : {}) })
          .sort({ updatedAt: -1 }).toArray();
        return res.status(200).json(active);
      }

      // History = everything not currently active (old docs without a status
      // field count as completed thanks to $ne).
      const sessions = await col.find({ userId, status: { $ne: 'active' }, ...(day ? { day } : {}) })
        .sort({ completedAt: -1 }).limit(parseInt(limit)).toArray();
      return res.status(200).json(sessions);
    }

    if (req.method === 'DELETE') {
      const { id, all, day } = req.query;
      if (all === 'true') {
        const r = await col.deleteMany({ userId });
        return res.status(200).json({ ok: true, deleted: r.deletedCount });
      }
      if (id) {
        let _id;
        try { _id = new ObjectId(String(id)); } catch { return res.status(400).json({ error: 'ungültige id' }); }
        await col.deleteOne({ userId, _id });
        return res.status(200).json({ ok: true });
      }
      if (day) {
        // delete the in-progress session for this day
        const r = await col.deleteOne({ userId, day, status: 'active' });
        return res.status(200).json({ ok: true, deleted: r.deletedCount });
      }
      return res.status(400).json({ error: 'id, day oder all=true erforderlich' });
    }

    return res.status(405).end();
  } catch (err) {
    console.error('[api/sessions] failed:', err);
    return res.status(500).json({ error: `Serverfehler: ${err?.message || 'unbekannt'}` });
  }
}
