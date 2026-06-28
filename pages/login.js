import { useState } from 'react';
import { signIn } from 'next-auth/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    await signIn('email', { email, callbackUrl: '/', redirect: false });
    setSent(true);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0c0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💪</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f0eeff', marginBottom: 8 }}>Training App</h1>
        <p style={{ color: '#6b6890', fontSize: 14, marginBottom: 36 }}>Gib deine E-Mail ein — du bekommst einen Magic Link.</p>

        {sent ? (
          <div style={{ background: '#1a3a1a', border: '1px solid #22c55e40', borderRadius: 14, padding: '24px' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
            <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>E-Mail gesendet!</div>
            <div style={{ color: '#6b6890', fontSize: 13 }}>Schau in dein Postfach und klick den Link.</div>
          </div>
        ) : (
          <div>
            <input
              type="email"
              placeholder="deine@email.de"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', background: '#13111a', border: '1px solid #2d2a3e', borderRadius: 10, padding: '14px 16px', color: '#f0eeff', fontSize: 15, outline: 'none', marginBottom: 12 }}
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !email}
              style={{ width: '100%', background: loading ? '#2d2a3e' : '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
            >
              {loading ? 'Sende…' : 'Magic Link senden →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
