import { SessionProvider } from 'next-auth/react';
import React from 'react';
import '../styles/globals.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    // Surface the real error in the browser console and (via SSR/log) the server.
    console.error('[ErrorBoundary]', error, info?.componentStack);
    this.setState({ info });
  }
  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;
    return (
      <div style={{ minHeight: '100vh', background: '#0c0a14', color: '#f0eeff', fontFamily: 'ui-monospace, Menlo, monospace', padding: 24, boxSizing: 'border-box' }}>
        <h1 style={{ color: '#f87171', fontSize: 18, margin: '0 0 12px' }}>App-Fehler</h1>
        <p style={{ color: '#6b6890', fontSize: 13, margin: '0 0 16px' }}>Es ist ein Fehler aufgetreten. Details unten.</p>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, color: '#fca5a5', background: '#1a1018', border: '1px solid #f8717130', padding: 14, borderRadius: 8, lineHeight: 1.6, margin: 0 }}>
{String(error?.message || error)}
{error?.stack ? '\n\n' + error.stack : ''}
{info?.componentStack ? '\n\nComponent stack:' + info.componentStack : ''}
        </pre>
        <button
          onClick={() => { this.setState({ error: null, info: null }); if (typeof window !== 'undefined') window.location.reload(); }}
          style={{ marginTop: 16, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}
        >
          Neu laden
        </button>
      </div>
    );
  }
}

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <ErrorBoundary>
        <Component {...pageProps} />
      </ErrorBoundary>
    </SessionProvider>
  );
}
