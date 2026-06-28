import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { DAYS } from '../lib/data';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Dumbbell, PersonStanding, Footprints, BarChart3, Flame, Trophy, Save,
  Check, Star, Circle, ChevronUp, ChevronDown, CornerDownRight, ArrowLeft,
  CalendarCheck, Layers,
} from 'lucide-react';

const DAY_ICONS = { dumbbell: Dumbbell, back: PersonStanding, legs: Footprints };

function DayIcon({ name, ...props }) {
  const Icon = DAY_ICONS[name] || Dumbbell;
  return <Icon {...props} />;
}

function RestTimer({ seconds, accent, onClose }) {
  const [remaining, setRemaining] = useState(seconds);
  const ref = useRef();
  useEffect(() => {
    ref.current = setInterval(() => setRemaining(r => r <= 1 ? (clearInterval(ref.current), 0) : r - 1), 1000);
    return () => clearInterval(ref.current);
  }, []);
  const pct = ((seconds - remaining) / seconds) * 100;
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

function ExerciseCard({ ex, accent, accentDim, bgCard, completedSets, onToggle, onSkip }) {
  const [open, setOpen] = useState(false);
  const states = Array.from({ length: ex.sets }, (_, i) => !!completedSets[`${ex.id}-${i}`]);
  const done = states.filter(Boolean).length;
  const allDone = done === ex.sets;

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
        <span style={{ color: '#333', marginLeft: 4, display: 'flex' }}>{open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid #ffffff06' }}>
          <div style={{ background: '#00000030', borderRadius: 8, padding: '10px 13px', margin: '12px 0', borderLeft: `3px solid ${ex.posture ? '#10b981' : accent}` }}>
            <p style={{ fontSize: 12, color: ex.posture ? '#6ee7b7' : accent + 'cc', margin: 0, lineHeight: 1.65 }}>{ex.tip}</p>
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

  const dayCount = { brust: 0, ruecken: 0, beine: 0 };
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
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { id: 'brust', label: 'Brust', icon: 'dumbbell', color: '#6366f1', count: dayCount.brust },
              { id: 'ruecken', label: 'Rücken', icon: 'back', color: '#0ea5e9', count: dayCount.ruecken },
              { id: 'beine', label: 'Beine', icon: 'legs', color: '#f59e0b', count: dayCount.beine },
            ].map(d => (
              <div key={d.id} style={{ flex: 1, background: d.color + '10', border: `1px solid ${d.color}25`, borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
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

export default function TrainingApp() {
  const { data: session, status } = useSession();
  const [view, setView] = useState('training'); // 'training' | 'stats'
  const [activeDay, setActiveDay] = useState('brust');
  const [allSets, setAllSets] = useState({ brust: {}, ruecken: {}, beine: {} });
  const [timer, setTimer] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [saving, setSaving] = useState(false);

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

  if (status === "loading") return <div style={{ minHeight: "100vh", background: "#0c0a14", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b6890", fontFamily: "Inter, sans-serif" }}>Laden…</div>;
  if (!session) return null;

  const toggle = (exId, si, rest) => {
    const key = `${exId}-${si}`;
    const already = completedSets[key];
    setAllSets(prev => ({ ...prev, [activeDay]: { ...prev[activeDay], [key]: !already } }));
    if (!already) setTimer({ seconds: rest, accent: day.accent });
  };

  const skip = (exId, si) => {
    const key = `${exId}-${si}`;
    setAllSets(prev => ({ ...prev, [activeDay]: { ...prev[activeDay], [key]: true } }));
  };

  const saveSession = async () => {
    setSaving(true);
    const duration = startTime ? Math.round((Date.now() - startTime) / 60000) : null;
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day: activeDay, exercises: day.exercises.map(e => e.name), totalSets, doneSets, durationMinutes: duration }),
    });
    setSaving(false);
    setAllSets(prev => ({ ...prev, [activeDay]: {} }));
    setStartTime(null);
    setView('stats');
  };

  if (view === 'stats') return <StatsView onBack={() => setView('training')} />;

  return (
    <div style={{ minHeight: '100vh', background: day.bg, fontFamily: 'Inter, system-ui, sans-serif', color: '#fff', transition: 'background 0.3s', paddingBottom: 60 }}>
      {timer && <RestTimer seconds={timer.seconds} accent={timer.accent} onClose={() => setTimer(null)} />}

      {/* Nav */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: day.bg + 'ee', backdropFilter: 'blur(10px)', borderBottom: '1px solid #ffffff08', padding: '10px 14px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: 8 }}>
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
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 0', letterSpacing: -0.5, display: 'flex', alignItems: 'center', gap: 9 }}><DayIcon name={day.icon} size={24} color={day.accent} /> {day.label} Tag</h1>
            </div>
            {doneSets > 0 && !finished && (
              <button onClick={() => setAllSets(prev => ({ ...prev, [activeDay]: {} }))} style={{ background: 'none', border: '1px solid #ffffff15', borderRadius: 8, color: '#555', fontSize: 11, padding: '6px 10px', cursor: 'pointer' }}>Reset</button>
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
          <ExerciseCard key={ex.id} ex={ex} accent={day.accent} accentDim={day.accentDim} bgCard={day.bg === '#0c0a14' ? '#13111a' : day.bg === '#080c12' ? '#0d1117' : '#110e00'} completedSets={completedSets} onToggle={toggle} onSkip={skip} />
        ))}

        {finished && (
          <div style={{ background: 'linear-gradient(135deg, #1a3a1a, #0f2010)', border: '1px solid #22c55e30', borderRadius: 14, padding: '22px', textAlign: 'center', marginTop: 4 }}>
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center', color: '#22c55e' }}><Trophy size={32} /></div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#22c55e' }}>{day.label} Tag abgeschlossen!</div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 4, marginBottom: 18 }}>{totalSets} Sets · Gut gemacht, Fabian</div>
            <button onClick={saveSession} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#22c55e', color: '#000', border: 'none', borderRadius: 10, padding: '14px 32px', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 15, fontWeight: 800, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Speichern…' : <><Save size={16} /> Session speichern</>}
            </button>
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
      </div>
    </div>
  );
}
