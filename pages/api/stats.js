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

    const sessions = await db.collection('sessions')
      .find({ userId, status: { $ne: 'active' } }).sort({ completedAt: -1 }).limit(50).toArray();

  const today = new Date(); today.setHours(0,0,0,0);
  const sessionDays = [...new Set(sessions.map(s => {
    const d = new Date(s.completedAt); d.setHours(0,0,0,0); return d.getTime();
  }))].sort((a,b) => b-a);

  let streak = 0;
  for (let i = 0; i < sessionDays.length; i++) {
    if (Math.abs(sessionDays[i] - (today.getTime() - i * 2 * 86400000)) < 86400000 * 2) streak++;
    else break;
  }

  const volumeByDay = { brust: [], ruecken: [], beine: [] };
  sessions.forEach(s => {
    if (volumeByDay[s.day]) volumeByDay[s.day].push({
      date: new Date(s.completedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
      sets: s.doneSets,
    });
  });

    return res.status(200).json({
      streak,
      volumeByDay,
      totalSessions: sessions.length,
      totalSets: sessions.reduce((a, s) => a + (s.doneSets || 0), 0),
    });
  } catch (err) {
    console.error('[api/stats] failed:', err);
    return res.status(500).json({ error: `Serverfehler: ${err?.message || 'unbekannt'}` });
  }
}
