export default function Verify() {
  return (
    <div style={{ minHeight: '100vh', background: '#0c0a14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#f0eeff', marginBottom: 8 }}>E-Mail gesendet!</h1>
        <p style={{ color: '#6b6890', fontSize: 14 }}>Schau in dein Postfach und klick den Magic Link.</p>
      </div>
    </div>
  );
}
