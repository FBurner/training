import bcrypt from 'bcryptjs';
import clientPromise from '../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, name } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'E-Mail und Passwort erforderlich' });
  }

  const normEmail = String(email).toLowerCase().trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normEmail)) {
    return res.status(400).json({ error: 'Ungültige E-Mail-Adresse' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Passwort muss mindestens 8 Zeichen lang sein' });
  }

  try {
    const client = await clientPromise;
    const db = client.db('training');
    const users = db.collection('users');

    const existing = await users.findOne({ email: normEmail });
    if (existing) {
      return res.status(409).json({ error: 'Diese E-Mail ist bereits registriert' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    await users.insertOne({
      email: normEmail,
      name: (name && String(name).trim()) || normEmail.split('@')[0],
      passwordHash,
      createdAt: new Date(),
    });

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[api/register] failed:', err);
    return res.status(500).json({ error: `Serverfehler: ${err?.message || 'unbekannt'}` });
  }
}
