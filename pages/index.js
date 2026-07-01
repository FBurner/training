import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { DAYS } from '../lib/data';
import ExerciseFigure from '../components/ExerciseFigure';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Dumbbell, PersonStanding, Footprints, BarChart3, Flame, Trophy, Save,
  Check, Star, Circle, ChevronUp, ChevronDown, CornerDownRight, ArrowLeft,
  CalendarCheck, Layers, Plus, Clock, Home, Play, Trash2, AlertTriangle,
  TrendingUp, User, Weight, Info, X,
} from 'lucide-react';

const DAY_ICONS = { dumbbell: Dumbbell, back: PersonStanding, legs: Footprints, kettlebell: Weight };

function DayIcon({ name, ...props }) {
  const Icon = DAY_ICONS[name] || Dumbbell;
  return <Icon {...props} />;
}

// First number in a suggested-weight string ("28–30 kg" -> 28, "Körpergewicht" -> 0).
function parseWeight(str) {
  if (!str) return 0;
  const m = String(str).match(/\d+(?:[.,]\d+)?/);
  return m ? Math.round(parseFloat(m[0].replace(',', '.'))) : 0;
}

// Progressive-overload step: bigger jump for primary compound lifts.
function stepFor(ex) { return ex.primary ? 5 : 2.5; }

function RestTimer({ seconds, accent, startedAt, onClose }) {
  // Timestamp-based: remaining is derived from wall-clock, so backgrounding
  // the tab (which suspends timers/intervals) never freezes the countdown —
  // when you come back it shows the correct time (or "done").
  const endAt = (startedAt || Date.now()) + seconds * 1000;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const iv = setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', tick); window.removeEventListener('focus', tick); };
  }, []);
  const remaining = Math.max(0, Math.ceil((endAt - now) / 1000));
  const pct = Math.min(100, ((seconds - remaining) / seconds) * 100);
  const done = remaining === 0;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#0d0d0d', border: `1px solid ${done ? '#22c55e40' : accent + '40'}`, borderRadius: 24, padding: '44px 52px', textAlign: 'center', minWidth: 280 }}>
        <p style={{ color: done ? '#22c55e' : accent, fontSize: 11, letterSpacing: 3, marginBottom: 20, textTransform: 'uppercase', fontWeight: 600 }}>{done ? 'Bereit' : 'Pause'}</p>
        <div style={{ position: 'relative', width: 130, height: 130, margin: '0 auto 28px' }}>
          <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="65" cy="65" r="56" fill="none" stroke="#1a1a1a" strokeWidth="8" />
            <circle cx="65" cy="65" r="56" fill="none" stroke={done ? '#22c55e' : accent} strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - pct / 100)}`}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, color: done ? '#22c55e' : '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {done ? <Check size={44} strokeWidth={3} /> : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`}
          </div>
        </div>
        <button onClick={onClose} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: done ? '#22c55e' : accent + '20', color: done ? '#000' : accent, border: `1px solid ${done ? '#22c55e' : accent + '40'}`, borderRadius: 10, padding: '12px 36px', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
          {done && <Check size={16} strokeWidth={3} />}{done ? 'Weiter' : 'Überspringen'}
        </button>
      </div>
    </div>
  );
}

function ExerciseCard({ ex, accent, accentDim, bgCard, completedSets, onToggle, onSkip, weight, onWeight, prevWeight }) {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(false);
  const states = Array.from({ length: ex.sets }, (_, i) => !!completedSets[`${ex.id}-${i}`]);
  const done = states.filter(Boolean).length;
  const allDone = done === ex.sets;
  const step = stepFor(ex);
  const w = weight === '' || weight == null ? null : Number(weight);
  const nextTarget = w && w > 0 ? w + step : null;

  return (
    <div style={{ background: bgCard, border: `1px solid ${allDone ? '#22c55e25' : open ? accent + '35' : '#ffffff08'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', background: 'none', border: 'none', padding: '15px 16px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: allDone ? '#1a3a1a' : accentDim, border: `1px solid ${allDone ? '#22c55e40' : accent + '30'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: allDone ? '#22c55e' : accent }}>
          {allDone ? <Check size={17} strokeWidth={3} /> : ex.primary ? <Star size={15} fill="currentColor" /> : <Circle size={12} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: allDone ? '#444' : '#fff' }}>{ex.name}</span>
            {ex.posture && <span style={{ fontSize: 9, background: '#10b98115', color: '#10b981', padding: '1px 6px', borderRadius: 4, fontWeight: 700, letterSpacing: 1 }}>HALTUNG</span>}
          </div>
          <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
            {ex.sets} × {ex.reps} · <span style={{ color: allDone ? '#444' : accent }}>{ex.weight}</span> · {done}/{ex.sets} Sets
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          {states.map((d, i) => <div key={i} style={{ width: 5, height: 5, borderRadius: 99, background: d ? accent : '#2a2a2a' }} />)}
        </div>
        <span role="button" tabIndex={0} title="Info & Illustration" onClick={e => { e.stopPropagation(); setInfo(true); }}
          style={{ display: 'flex', color: accent, opacity: 0.75, marginLeft: 2, cursor: 'pointer' }}>
          <Info size={16} />
        </span>
        <span style={{ color: '#333', marginLeft: 4, display: 'flex' }}>{open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
      </button>

      {info && (
        <div onClick={() => setInfo(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0d0d0f', border: `1px solid ${accent}40`, borderRadius: 18, padding: 22, maxWidth: 380, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{ex.name}</div>
                <div style={{ fontSize: 12, color: '#6b6890', marginTop: 2 }}>{ex.sub}</div>
              </div>
              <button onClick={() => setInfo(false)} style={{ background: '#1a1a1a', border: '1px solid #ffffff12', borderRadius: 8, color: '#888', padding: 6, cursor: 'pointer', display: 'flex', flexShrink: 0 }}><X size={16} /></button>
            </div>
            <div style={{ background: '#00000040', border: '1px solid #ffffff08', borderRadius: 12, padding: '14px', margin: '10px 0 14px', display: 'flex', justifyContent: 'center' }}>
              <ExerciseFigure exId={ex.id} color={accent} size={210} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <span style={{ fontSize: 11, background: accent + '18', color: accent, padding: '3px 9px', borderRadius: 6, fontWeight: 700 }}>{ex.focus}</span>
              <span style={{ fontSize: 11, background: '#ffffff08', color: '#aaa', padding: '3px 9px', borderRadius: 6, fontWeight: 600 }}>{ex.sets} × {ex.reps}</span>
              <span style={{ fontSize: 11, background: '#ffffff08', color: '#aaa', padding: '3px 9px', borderRadius: 6, fontWeight: 600 }}>{ex.weight}</span>
              {ex.posture && <span style={{ fontSize: 11, background: '#10b98115', color: '#10b981', padding: '3px 9px', borderRadius: 6, fontWeight: 700 }}>HALTUNG</span>}
            </div>
            <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.65, margin: 0 }}>{ex.tip}</p>
            <p style={{ fontSize: 11, color: '#555', margin: '12px 0 0', lineHeight: 1.5 }}>Schematische Darstellung der Bewegung.</p>
          </div>
        </div>
      )}

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #ffffff06' }}>
          <div style={{ background: '#00000030', borderRadius: 8, padding: '10px 13px', margin: '12px 0', borderLeft: `3px solid ${ex.posture ? '#10b981' : accent}` }}>
            <p style={{ fontSize: 12, color: ex.posture ? '#6ee7b7' : accent + 'cc', margin: 0, lineHeight: 1.65 }}>{ex.tip}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <label style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Gewicht</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="number" inputMode="decimal" min="0" step="0.5"
                value={weight ?? ''}
                placeholder={String(parseWeight(ex.weight) || '')}
                onChange={e => onWeight(ex.id, e.target.value === '' ? '' : Number(e.target.value))}
                onClick={e => e.stopPropagation()}
                style={{ width: 84, background: '#00000040', border: `1px solid ${accent}40`, borderRadius: 8, padding: '8px 10px', color: '#fff', fontSize: 14, outline: 'none' }}
              />
              <span style={{ fontSize: 12, color: '#666' }}>kg</span>
            </div>
            <span style={{ fontSize: 11, color: '#555' }}>{prevWeight ? `zuletzt ${prevWeight} kg` : `Vorschlag ${ex.weight}`}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {states.map((d, si) => (
              <div key={si} style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => onToggle(ex.id, si, ex.rest)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, background: d ? '#1a3a1a' : '#00000030', border: `1px solid ${d ? '#22c55e40' : '#ffffff08'}`, borderRadius: 10, padding: '11px 14px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: d ? '#22c55e' : accentDim, border: `1px solid ${d ? '#22c55e' : accent + '40'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: d ? '#000' : accent, fontSize: 13, fontWeight: 700 }}>
                    {d ? <Check size={15} strokeWidth={3} /> : si + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: d ? '#555' : '#eee' }}>Set {si + 1}</span>
                    <span style={{ fontSize: 11, color: d ? '#444' : accent, marginLeft: 8 }}>{ex.weight}</span>
                    <span style={{ fontSize: 11, color: '#444', marginLeft: 5 }}>· {ex.reps} Wdh</span>
                  </div>
                  {!d && <span style={{ fontSize: 10, color: accent, fontWeight: 700 }}>DONE</span>}
                </button>
                {!d && (
                  <button onClick={() => onSkip(ex.id, si)} title="Überspringen" style={{ width: 40, background: '#1a1a1a', border: '1px solid #ffffff08', borderRadius: 10, cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><CornerDownRight size={16} /></button>
                )}
              </div>
            ))}
          </div>
          {allDone && nextTarget && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#0f1a0f', border: '1px solid #22c55e30', borderRadius: 8, padding: '10px 12px', marginTop: 12 }}>
              <TrendingUp size={16} color="#22c55e" />
              <div>
                <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700 }}>Nächstes Mal: {nextTarget} kg</div>
                <div style={{ fontSize: 11, color: '#6b6890' }}>+{step} kg Steigerung empfohlen</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatsView({ onBack }) {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats').then(r => r.json()),
      fetch('/api/sessions?limit=20').then(r => r.json()),
    ]).then(([s, h]) => {
      setStats(s);
      setHistory(h);
      setLoading(false);
    });
  }, []);

  const accent = '#6366f1';

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center', color: '#6366f1' }}><BarChart3 size={32} /></div>
        <div style={{ color: '#555' }}>Lade Statistiken…</div>
      </div>
    </div>
  );

  const chartData = history.slice(0, 10).reverse().map(s => ({
    date: new Date(s.completedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    sets: s.doneSets,
    day: s.day,
  }));

  const dayCount = { brust: 0, ruecken: 0, beine: 0, kettlebell: 0 };
  history.forEach(s => { if (dayCount[s.day] !== undefined) dayCount[s.day]++; });

  return (
    <div style={{ minHeight: '100vh', background: '#080808', fontFamily: 'Inter, system-ui, sans-serif', color: '#fff', paddingBottom: 60 }}>
      <div style={{ background: '#0d0d0d', borderBottom: '1px solid #ffffff08', padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8, color: '#888', padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><ArrowLeft size={15} /> Zurück</button>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><BarChart3 size={20} /> Statistiken</h1>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Sessions', value: stats.totalSessions, Icon: CalendarCheck, color: '#6366f1' },
            { label: 'Total Sets', value: stats.totalSets, Icon: Layers, color: '#0ea5e9' },
            { label: 'Streak', value: `${stats.streak}x`, Icon: Flame, color: '#f59e0b' },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} style={{ background: '#0d0d0d', border: '1px solid #ffffff08', borderRadius: 12, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'center', color }}><Icon size={20} /></div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
              <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Day distribution */}
        <div style={{ background: '#0d0d0d', border: '1px solid #ffffff08', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
          <p style={{ fontSize: 10, color: '#6366f1', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, margin: '0 0 14px' }}>Trainingstage</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { id: 'brust', label: 'Brust', icon: 'dumbbell', color: '#6366f1', count: dayCount.brust },
              { id: 'ruecken', label: 'Rücken', icon: 'back', color: '#0ea5e9', count: dayCount.ruecken },
              { id: 'beine', label: 'Beine', icon: 'legs', color: '#f59e0b', count: dayCount.beine },
              { id: 'kettlebell', label: 'Kettlebell', icon: 'kettlebell', color: '#10b981', count: dayCount.kettlebell },
            ].map(d => (
              <div key={d.id} style={{ flex: '1 1 40%', background: d.color + '10', border: `1px solid ${d.color}25`, borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: d.color }}>{d.count}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 10, color: '#555', marginTop: 3 }}><DayIcon name={d.icon} size={13} color={d.color} /> {d.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Volume chart */}
        {chartData.length > 0 && (
          <div style={{ background: '#0d0d0d', border: '1px solid #ffffff08', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
            <p style={{ fontSize: 10, color: '#6366f1', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, margin: '0 0 14px' }}>Volumen (letzte Sessions)</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: '#444', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#444', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Bar dataKey="sets" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* History list */}
        <div style={{ background: '#0d0d0d', border: '1px solid #ffffff08', borderRadius: 12, padding: '16px' }}>
          <p style={{ fontSize: 10, color: '#6366f1', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, margin: '0 0 14px' }}>Letzte Sessions</p>
          {history.length === 0 ? (
            <p style={{ color: '#444', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>Noch keine Sessions gespeichert</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {history.slice(0, 8).map((s, i) => {
                const d = DAYS[s.day];
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#ffffff04', borderRadius: 10, padding: '10px 12px' }}>
                    <span style={{ display: 'flex' }}><DayIcon name={d?.icon} size={20} color={d?.accent || '#888'} /></span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{d?.label || s.day} Tag</div>
                      <div style={{ fontSize: 11, color: '#555' }}>{new Date(s.completedAt).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' })}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: d?.accent || '#fff' }}>{s.doneSets} Sets</div>
                      <div style={{ fontSize: 10, color: '#555' }}>von {s.totalSets}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewView({ onNew, onResume, onStats, onProfile }) {
  const [sessions, setSessions] = useState([]);
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/sessions?limit=30').then(r => (r.ok ? r.json() : [])),
      fetch('/api/sessions?status=active').then(r => (r.ok ? r.json() : [])),
    ])
      .then(([done, act]) => {
        setSessions(Array.isArray(done) ? done : []);
        setActive(Array.isArray(act) ? act : []);
        setLoading(false);
      })
      .catch(err => { console.error('[overview] load sessions failed:', err); setLoading(false); });
  }, []);


  return (
    <div style={{ minHeight: '100vh', background: '#0c0a14', fontFamily: 'Inter, system-ui, sans-serif', color: '#fff', paddingBottom: 60 }}>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '28px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Deine Sessions</h1>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onProfile} title="Profil" style={{ width: 42, height: 42, background: 'transparent', border: '1px solid #ffffff12', borderRadius: 10, cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={18} /></button>
            <button onClick={onStats} title="Statistiken" style={{ width: 42, height: 42, background: 'transparent', border: '1px solid #ffffff12', borderRadius: 10, cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart3 size={18} /></button>
          </div>
        </div>
        <p style={{ color: '#6b6890', fontSize: 14, margin: '0 0 22px' }}>Überblick über dein Training.</p>

        <button onClick={onNew} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontSize: 16, fontWeight: 800, cursor: 'pointer', marginBottom: 28 }}>
          <Plus size={20} /> Neue Session starten
        </button>

        {active.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 10, color: '#22c55e', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, margin: '0 0 12px' }}>Laufende Session{active.length > 1 ? 's' : ''}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {active.map((s, i) => {
                const d = DAYS[s.day];
                const accent = d?.accent || '#888';
                return (
                  <button key={s._id || i} onClick={() => onResume(s.day, s.completedSets || {})} style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#0f1a0f', border: '1px solid #22c55e35', borderRadius: 12, padding: '13px 14px', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: accent + '18', border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
                      <DayIcon name={d?.icon} size={19} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{d?.label || s.day} Tag</div>
                      <div style={{ fontSize: 11, color: '#22c55e', marginTop: 2 }}>{s.doneSets}/{s.totalSets} Sets · fortsetzen</div>
                    </div>
                    <span style={{ display: 'flex', color: '#22c55e' }}><Play size={18} /></span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <p style={{ fontSize: 10, color: '#6366f1', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, margin: '0 0 12px' }}>Vergangene Sessions</p>

        {loading ? (
          <div style={{ color: '#555', fontSize: 13, padding: '24px 0', textAlign: 'center' }}>Lade…</div>
        ) : sessions.length === 0 ? (
          <div style={{ background: '#ffffff04', border: '1px solid #ffffff08', borderRadius: 12, padding: '28px 16px', textAlign: 'center', color: '#555', fontSize: 13 }}>
            Noch keine Sessions gespeichert — starte deine erste!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map((s, i) => {
              const d = DAYS[s.day];
              const accent = d?.accent || '#888';
              return (
                <div key={s._id || i} style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#0d0d0d', border: '1px solid #ffffff08', borderRadius: 12, padding: '13px 14px' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: accent + '18', border: `1px solid ${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>
                    <DayIcon name={d?.icon} size={19} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{d?.label || s.day} Tag</div>
                    <div style={{ fontSize: 11, color: '#555', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
                      <span>{new Date(s.completedAt).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                      {s.durationMinutes ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>· <Clock size={11} /> {s.durationMinutes} Min</span> : null}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: accent }}>{s.doneSets}</div>
                    <div style={{ fontSize: 10, color: '#555' }}>von {s.totalSets} Sets</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileView({ onBack }) {
  const [profile, setProfile] = useState(null);
  const [bw, setBw] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = () => fetch('/api/profile')
    .then(r => (r.ok ? r.json() : null))
    .then(p => { setProfile(p); if (p?.bodyWeight != null) setBw(String(p.bodyWeight)); })
    .catch(e => console.error('[profile] load failed:', e));
  useEffect(() => { load(); }, []);

  const saveBw = async () => {
    if (bw === '' || Number.isNaN(Number(bw))) return;
    setSaving(true); setMsg(null);
    try {
      const r = await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bodyWeight: Number(bw) }) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
      await load();
      setMsg('Gespeichert');
    } catch (e) { setMsg('Fehler: ' + e.message); } finally { setSaving(false); }
  };

  const resetAll = async () => {
    if (!window.confirm('ALLES zurücksetzen? Alle Sessions und Gewichte werden gelöscht. Kann nicht rückgängig gemacht werden.')) return;
    setMsg(null);
    try {
      const r1 = await fetch('/api/sessions?all=true', { method: 'DELETE' });
      if (!r1.ok) throw new Error((await r1.json().catch(() => ({}))).error || `HTTP ${r1.status}`);
      const r2 = await fetch('/api/profile', { method: 'DELETE' });
      if (!r2.ok) throw new Error((await r2.json().catch(() => ({}))).error || `HTTP ${r2.status}`);
      await load(); setBw('');
      setMsg('Alles zurückgesetzt.');
    } catch (e) { setMsg('Fehler: ' + e.message); }
  };

  const working = profile?.workingWeights || {};
  const history = (profile?.bodyHistory || []).slice(-10).reverse();

  return (
    <div style={{ minHeight: '100vh', background: '#0c0a14', fontFamily: 'Inter, system-ui, sans-serif', color: '#fff', paddingBottom: 60 }}>
      <div style={{ background: '#0d0d0d', borderBottom: '1px solid #ffffff08', padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8, color: '#888', padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><ArrowLeft size={15} /> Zurück</button>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><User size={20} /> Profil</h1>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
        <div style={{ background: '#0d0d0d', border: '1px solid #ffffff08', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
          <p style={{ fontSize: 10, color: '#6366f1', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, margin: '0 0 12px' }}>Körpergewicht</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input type="number" inputMode="decimal" min="0" step="0.1" value={bw} onChange={e => setBw(e.target.value)} placeholder="z.B. 140"
              style={{ width: 120, background: '#00000040', border: '1px solid #6366f140', borderRadius: 8, padding: '10px 12px', color: '#fff', fontSize: 15, outline: 'none' }} />
            <span style={{ color: '#666', fontSize: 13 }}>kg</span>
            <button onClick={saveBw} disabled={saving} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? '…' : 'Speichern'}</button>
          </div>
          {msg && <div style={{ fontSize: 12, color: String(msg).startsWith('Fehler') ? '#f87171' : '#22c55e', marginTop: 10 }}>{msg}</div>}
          {history.length > 0 && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {history.map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', borderTop: i ? '1px solid #ffffff06' : 'none', paddingTop: i ? 5 : 0 }}>
                  <span>{new Date(h.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
                  <span style={{ color: '#ccc', fontWeight: 600 }}>{h.weight} kg</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: '#0d0d0d', border: '1px solid #ffffff08', borderRadius: 12, padding: '16px', marginBottom: 16 }}>
          <p style={{ fontSize: 10, color: '#6366f1', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, margin: '0 0 12px' }}>Arbeitsgewichte</p>
          {Object.values(DAYS).map(d => {
            const exs = d.exercises.filter(ex => working[ex.id]);
            if (!exs.length) return null;
            return (
              <div key={d.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: d.accent, marginBottom: 6 }}><DayIcon name={d.icon} size={14} /> {d.label}</div>
                {exs.map(ex => (
                  <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#aaa', padding: '4px 0' }}>
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
                    <span style={{ color: '#fff', fontWeight: 700, marginLeft: 10 }}>{working[ex.id]} kg</span>
                  </div>
                ))}
              </div>
            );
          })}
          {!Object.keys(working).length && <p style={{ color: '#555', fontSize: 13, margin: 0 }}>Noch keine Gewichte — trag im Training dein Gewicht ein.</p>}
        </div>

        <div style={{ border: '1px solid #f8717140', borderRadius: 12, padding: '16px', background: '#160e10' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#f87171', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, margin: '0 0 6px' }}><AlertTriangle size={14} /> Danger Zone</p>
          <p style={{ color: '#6b6890', fontSize: 12, margin: '0 0 14px' }}>Setzt alle Sessions und Gewichte zurück. Kann nicht rückgängig gemacht werden.</p>
          <button onClick={resetAll} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f87171', color: '#1a0808', border: 'none', borderRadius: 9, padding: '11px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}><Trash2 size={15} /> Alles zurücksetzen</button>
        </div>
      </div>
    </div>
  );
}

export default function TrainingApp() {
  const { data: session, status } = useSession();
  const [view, setView] = useState('overview'); // 'overview' | 'training' | 'stats'
  const [activeDay, setActiveDay] = useState('brust');
  const [allSets, setAllSets] = useState({ brust: {}, ruecken: {}, beine: {}, kettlebell: {} });
  const [allWeights, setAllWeights] = useState({ brust: {}, ruecken: {}, beine: {}, kettlebell: {} });
  const [profileWeights, setProfileWeights] = useState({}); // last working weight per exercise
  const [lastDoneByDay, setLastDoneByDay] = useState({}); // day -> last completedAt (ms)
  const [timer, setTimer] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [syncState, setSyncState] = useState(null); // null | 'saving' | 'saved' | error string

  const day = DAYS[activeDay];
  const completedSets = allSets[activeDay];
  const totalSets = day.exercises.reduce((a, e) => a + e.sets, 0);
  const doneSets = Object.values(completedSets).filter(Boolean).length;
  const pct = Math.round((doneSets / totalSets) * 100);
  const finished = doneSets === totalSets;

  useEffect(() => {
    if (doneSets === 1 && !startTime) setStartTime(Date.now());
  }, [doneSets]);

  useEffect(() => {
    if (status !== "loading" && !session && typeof window !== "undefined") window.location.href = "/login";
  }, [status, session]);

  // Restore in-progress sessions + per-exercise working weights so a workout
  // can be resumed and weights are pre-filled with your progress.
  useEffect(() => {
    if (status !== 'authenticated') return;
    (async () => {
      // 1) base weight defaults from the exercise data
      const baseW = {};
      Object.values(DAYS).forEach(d => { baseW[d.id] = {}; d.exercises.forEach(ex => { baseW[d.id][ex.id] = parseWeight(ex.weight); }); });
      // 2) profile working weights (your progressed targets)
      let working = {};
      try {
        const r = await fetch('/api/profile');
        if (r.ok) { const p = await r.json(); working = p?.workingWeights || {}; }
      } catch (err) { console.error('[hydrate profile] failed:', err); }
      setProfileWeights(working);
      Object.values(DAYS).forEach(d => d.exercises.forEach(ex => { if (working[ex.id] != null) baseW[d.id][ex.id] = working[ex.id]; }));
      // 3) active sessions: restore completed sets + weights actually entered
      const setsByDay = {};
      try {
        const r = await fetch('/api/sessions?status=active');
        if (r.ok) {
          const active = await r.json();
          if (Array.isArray(active)) active.forEach(s => {
            if (!DAYS[s.day]) return;
            if (s.completedSets) setsByDay[s.day] = s.completedSets;
            if (s.weights) Object.assign(baseW[s.day], s.weights);
          });
        }
      } catch (err) { console.error('[hydrate active] failed:', err); }
      setAllWeights(baseW);
      if (Object.keys(setsByDay).length) setAllSets(prev => ({ ...prev, ...setsByDay }));
      // 4) completed sessions -> last-done per day (for the rest-day cooldown)
      try {
        const r = await fetch('/api/sessions?limit=60');
        if (r.ok) {
          const done = await r.json();
          const last = {};
          if (Array.isArray(done)) done.forEach(s => {
            const t = new Date(s.completedAt).getTime();
            if (!Number.isNaN(t) && (!last[s.day] || t > last[s.day])) last[s.day] = t;
          });
          setLastDoneByDay(last);
        }
      } catch (err) { console.error('[hydrate history] failed:', err); }
    })();
  }, [status]);

  const REST_DAYS = 6;
  const cooldownFor = (dayId) => {
    const last = lastDoneByDay[dayId];
    if (!last) return 0;
    return Math.max(0, Math.ceil(REST_DAYS - (Date.now() - last) / 86400000));
  };

  if (status === "loading") return <div style={{ minHeight: "100vh", background: "#0c0a14", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b6890", fontFamily: "Inter, sans-serif" }}>Laden…</div>;
  if (!session) return null;

  // Persist the in-progress session (fire-and-forget) so it is stored the
  // moment it starts and after every set — enabling resume.
  const persistActive = (dayId, sets, weights) => {
    const dayObj = DAYS[dayId];
    const total = dayObj.exercises.reduce((a, e) => a + e.sets, 0);
    const done = Object.values(sets).filter(Boolean).length;
    setSyncState('saving');
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day: dayId, exercises: dayObj.exercises.map(e => e.name), totalSets: total, doneSets: done, completedSets: sets, weights: weights || {}, status: 'active' }),
    })
      .then(async r => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.error || `HTTP ${r.status}`);
        }
        setSyncState('saved');
      })
      .catch(err => { console.error('[autosave] failed:', err); setSyncState(`Sync-Fehler: ${err.message}`); });
  };

  const toggle = (exId, si, rest) => {
    const key = `${exId}-${si}`;
    const already = completedSets[key];
    const updated = { ...completedSets, [key]: !already };
    setAllSets(prev => ({ ...prev, [activeDay]: updated }));
    if (!already) setTimer({ seconds: rest, accent: day.accent, startedAt: Date.now() });
    persistActive(activeDay, updated, allWeights[activeDay]);
  };

  const skip = (exId, si) => {
    const key = `${exId}-${si}`;
    const updated = { ...completedSets, [key]: true };
    setAllSets(prev => ({ ...prev, [activeDay]: updated }));
    persistActive(activeDay, updated, allWeights[activeDay]);
  };

  const setWeight = (exId, val) => {
    const updated = { ...(allWeights[activeDay] || {}), [exId]: val };
    setAllWeights(prev => ({ ...prev, [activeDay]: updated }));
    persistActive(activeDay, completedSets, updated);
  };

  const saveSession = async () => {
    setSaving(true);
    setSaveError(null);
    const duration = startTime ? Math.round((Date.now() - startTime) / 60000) : null;
    const usedWeights = allWeights[activeDay] || {};
    // Progress each completed exercise: next working weight = used + step.
    const nextWorking = {};
    day.exercises.forEach(ex => {
      const w = Number(usedWeights[ex.id]) || 0;
      if (w > 0) nextWorking[ex.id] = w + stepFor(ex);
    });
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: activeDay, exercises: day.exercises.map(e => e.name), totalSets, doneSets, completedSets, weights: usedWeights, durationMinutes: duration, status: 'completed' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Speichern fehlgeschlagen (HTTP ${res.status})`);
      }
      // Store progressed targets in the profile for next time (best-effort).
      if (Object.keys(nextWorking).length) {
        fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workingWeights: nextWorking }) })
          .catch(err => console.error('[profile update] failed:', err));
        setProfileWeights(prev => ({ ...prev, ...nextWorking }));
        setAllWeights(prev => ({ ...prev, [activeDay]: { ...prev[activeDay], ...nextWorking } }));
      }
      setLastDoneByDay(prev => ({ ...prev, [activeDay]: Date.now() }));
      setAllSets(prev => ({ ...prev, [activeDay]: {} }));
      setStartTime(null);
      setView('overview');
    } catch (err) {
      console.error('[saveSession] failed:', err);
      setSaveError(err?.message || 'Speichern fehlgeschlagen');
    } finally {
      setSaving(false);
    }
  };

  const deleteCurrentSession = async () => {
    if (!window.confirm('Diese Session löschen?')) return;
    try {
      const r = await fetch(`/api/sessions?day=${activeDay}`, { method: 'DELETE' });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
      setAllSets(prev => ({ ...prev, [activeDay]: {} }));
      setStartTime(null);
      setView('overview');
    } catch (e) { setSaveError('Löschen fehlgeschlagen: ' + e.message); }
  };

  if (view === 'overview') return <OverviewView
    onNew={() => setView('select')}
    onResume={(d, sets) => { setAllSets(prev => ({ ...prev, [d]: sets || {} })); setActiveDay(d); setView('training'); }}
    onStats={() => setView('stats')}
    onProfile={() => setView('profile')}
  />;

  if (view === 'profile') return <ProfileView onBack={() => setView('overview')} />;

  if (view === 'select') return (
    <div style={{ minHeight: '100vh', background: '#0c0a14', fontFamily: 'Inter, system-ui, sans-serif', color: '#fff', padding: '28px 16px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <button onClick={() => setView('overview')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: 8, color: '#888', padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}><ArrowLeft size={15} /> Zurück</button>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: '18px 0 6px' }}>Tag wählen</h1>
        <p style={{ color: '#6b6890', fontSize: 14, margin: '0 0 22px' }}>Womit startest du heute?</p>
        <p style={{ color: '#555', fontSize: 12, margin: '-14px 0 18px' }}>Nach jeder Einheit: {REST_DAYS} Tage Pause für diesen Tag.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Object.values(DAYS).map(d => {
            const cd = cooldownFor(d.id);
            const locked = cd > 0;
            return (
              <button key={d.id} disabled={locked}
                onClick={() => { if (locked) return; setActiveDay(d.id); persistActive(d.id, allSets[d.id] || {}, allWeights[d.id] || {}); setView('training'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, background: locked ? '#111' : d.accent + '12', border: `1px solid ${locked ? '#ffffff10' : d.accent + '40'}`, borderRadius: 14, padding: '18px 16px', cursor: locked ? 'not-allowed' : 'pointer', textAlign: 'left', opacity: locked ? 0.55 : 1 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: (locked ? '#888' : d.accent) + '20', border: `1px solid ${(locked ? '#888' : d.accent)}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: locked ? '#888' : d.accent }}><DayIcon name={d.icon} size={24} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: locked ? '#888' : '#fff' }}>{d.label}</div>
                  <div style={{ fontSize: 12, color: locked ? '#f59e0b' : '#6b6890', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                    {locked ? <><Clock size={12} /> Erst in {cd} {cd === 1 ? 'Tag' : 'Tagen'} wieder</> : `${d.tag} · ${d.duration}`}
                  </div>
                </div>
                <span style={{ color: locked ? '#555' : d.accent, display: 'flex' }}>{locked ? <Clock size={20} /> : <Play size={20} />}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
  if (view === 'stats') return <StatsView onBack={() => setView('overview')} />;

  return (
    <div style={{ minHeight: '100vh', background: day.bg, fontFamily: 'Inter, system-ui, sans-serif', color: '#fff', transition: 'background 0.3s', paddingBottom: 60 }}>
      {timer && <RestTimer seconds={timer.seconds} accent={timer.accent} startedAt={timer.startedAt} onClose={() => setTimer(null)} />}

      {/* Nav */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: day.bg + 'ee', backdropFilter: 'blur(10px)', borderBottom: '1px solid #ffffff08', padding: '10px 14px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: 8 }}>
          <button onClick={() => setView('overview')} title="Übersicht" style={{ width: 44, background: 'transparent', border: '1px solid #ffffff10', borderRadius: 10, cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Home size={18} /></button>
          {Object.values(DAYS).map(d => {
            const dTotal = d.exercises.reduce((a, e) => a + e.sets, 0);
            const dDone = Object.values(allSets[d.id]).filter(Boolean).length;
            const active = activeDay === d.id;
            return (
              <button key={d.id} onClick={() => setActiveDay(d.id)} style={{ flex: 1, background: active ? d.accent + '20' : 'transparent', border: `1px solid ${active ? d.accent + '60' : '#ffffff10'}`, borderRadius: 10, padding: '8px 4px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, transition: 'all 0.2s' }}>
                <DayIcon name={d.icon} size={17} color={active ? d.accent : '#666'} />
                <span style={{ fontSize: 11, fontWeight: 700, color: active ? d.accent : '#555' }}>{d.label}</span>
                {dDone > 0 && <span style={{ fontSize: 9, color: dDone === dTotal ? '#22c55e' : d.accent, fontWeight: 600 }}>{dDone}/{dTotal}</span>}
              </button>
            );
          })}
          <button onClick={() => setView('stats')} style={{ width: 44, background: 'transparent', border: '1px solid #ffffff10', borderRadius: 10, cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart3 size={18} /></button>
        </div>
      </div>

      {/* Header */}
      <div style={{ background: day.headerBg, borderBottom: '1px solid #ffffff06', padding: '22px 16px 18px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 10, color: day.accent, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 600 }}>{day.tag}</span>
              {syncState && (
                <span style={{ display: 'block', fontSize: 10, marginTop: 3, fontWeight: 600, color: String(syncState).startsWith('Sync-Fehler') ? '#f87171' : '#22c55e' }}>
                  {syncState === 'saving' ? 'Speichere…' : syncState === 'saved' ? 'Gespeichert' : syncState}
                </span>
              )}
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 0', letterSpacing: -0.5, display: 'flex', alignItems: 'center', gap: 9 }}><DayIcon name={day.icon} size={24} color={day.accent} /> {day.label} Tag</h1>
            </div>
            {doneSets > 0 && !finished && (
              <button onClick={() => { setAllSets(prev => ({ ...prev, [activeDay]: {} })); persistActive(activeDay, {}, allWeights[activeDay]); }} style={{ background: 'none', border: '1px solid #ffffff15', borderRadius: 8, color: '#555', fontSize: 11, padding: '6px 10px', cursor: 'pointer' }}>Reset</button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
            <div style={{ flex: 1, height: 5, background: '#ffffff10', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: finished ? '#22c55e' : day.accent, borderRadius: 99, transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ fontSize: 11, color: finished ? '#22c55e' : day.accent, fontWeight: 700, minWidth: 48 }}>{pct}%</span>
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
            {[{ label: 'Sets', value: `${doneSets}/${totalSets}` }, { label: 'Übungen', value: day.exercises.length }, { label: 'Dauer', value: day.duration }].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: '#444', marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div style={{ maxWidth: 600, margin: '14px auto 0', padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {day.exercises.map(ex => (
          <ExerciseCard key={ex.id} ex={ex} accent={day.accent} accentDim={day.accentDim} bgCard={day.bg === '#0c0a14' ? '#13111a' : day.bg === '#080c12' ? '#0d1117' : day.bg === '#07120e' ? '#0c1a15' : '#110e00'} completedSets={completedSets} onToggle={toggle} onSkip={skip} weight={(allWeights[activeDay] || {})[ex.id] ?? ''} onWeight={setWeight} prevWeight={profileWeights[ex.id]} />
        ))}

        {finished && (
          <div style={{ background: 'linear-gradient(135deg, #1a3a1a, #0f2010)', border: '1px solid #22c55e30', borderRadius: 14, padding: '22px', textAlign: 'center', marginTop: 4 }}>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', color: '#22c55e' }}><Trophy size={32} /></div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#22c55e' }}>{day.label} Tag abgeschlossen!</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 4, marginBottom: 18 }}>{totalSets} Sets · Gut gemacht, Fabian</div>
            <button onClick={saveSession} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#22c55e', color: '#000', border: 'none', borderRadius: 10, padding: '14px 32px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 800, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Speichern…' : <><Save size={16} /> Session speichern</>}
            </button>
            {saveError && (
              <div style={{ marginTop: 12, color: '#f87171', fontSize: 12, lineHeight: 1.5 }}>{saveError}</div>
            )}
          </div>
        )}

        <div style={{ background: '#ffffff04', border: '1px solid #ffffff06', borderRadius: 14, padding: '14px', marginTop: 4 }}>
          <p style={{ fontSize: 10, color: day.accent, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 10px', fontWeight: 700 }}>Hinweise</p>
          {day.notes.map((note, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7 }}>
              <span style={{ color: day.accent, flexShrink: 0 }}>·</span>
              <p style={{ fontSize: 11, color: '#555', margin: 0, lineHeight: 1.65 }}>{note}</p>
            </div>
          ))}
        </div>

        <div style={{ border: '1px solid #f8717130', borderRadius: 14, padding: '14px', marginTop: 10, background: '#160e10' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, color: '#f87171', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, margin: '0 0 10px' }}><AlertTriangle size={13} /> Danger Zone</p>
          <button onClick={deleteCurrentSession} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: '#f87171', border: '1px solid #f8717140', borderRadius: 9, padding: '10px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}><Trash2 size={15} /> Diese Session löschen</button>
        </div>
      </div>
    </div>
  );
}
