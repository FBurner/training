import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Dumbbell } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputStyle = {
    width: '100%', background: '#13111a', border: '1px solid #2d2a3e', borderRadius: 10,
    padding: '14px 16px', color: '#f0eeff', fontSize: 15, outline: 'none', marginBottom: 12,
  };

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');

    try {
      if (mode === 'register') {
        const res = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Registrierung fehlgeschlagen');
          setLoading(false);
          return;
        }
      }

      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError(mode === 'register' ? 'Konto erstellt, Login fehlgeschlagen.' : 'E-Mail oder Passwort falsch');
        setLoading(false);
        return;
      }
      window.location.href = '/';
    } catch (e) {
      setError('Etwas ist schiefgelaufen. Versuch es nochmal.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0c0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center', color: '#6366f1' }}><Dumbbell size={44} /></div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#f0eeff', marginBottom: 8 }}>Training App</h1>
        <p style={{ color: '#6b6890', fontSize: 14, marginBottom: 36 }}>
          {mode === 'login' ? 'Melde dich mit E-Mail und Passwort an.' : 'Erstelle ein Konto mit E-Mail und Passwort.'}
        </p>

        <input
          type="email"
          placeholder="deine@email.de"
          value={email}
          autoComplete="email"
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={inputStyle}
        />

        {error && (
          <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          style={{ width: '100%', background: loading ? '#2d2a3e' : '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 15, fontWeight: 700, cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}
        >
          {loading ? 'Bitte warten…' : mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
        </button>

        <div style={{ marginTop: 20, color: '#6b6890', fontSize: 13 }}>
          {mode === 'login' ? 'Noch kein Konto?' : 'Schon registriert?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#8b5cf6', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0 }}
          >
            {mode === 'login' ? 'Registrieren' : 'Anmelden'}
          </button>
        </div>
      </div>
    </div>
  );
}
