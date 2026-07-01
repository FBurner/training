import React from 'react';

// Schematic movement illustration per exercise id. Pure inline SVG (no
// external assets) so it always renders. Grouped by movement pattern.
const PATTERN = {
  // Brust
  b1: 'press', b2: 'press', b3: 'press', b4: 'fly', b5: 'press', b6: 'fly',
  // Rücken
  r1: 'row', r2: 'pulldown', r3: 'cable', r4: 'row', r5: 'fly', r6: 'hinge',
  // Beine
  l1: 'squat', l2: 'legiso', l3: 'legiso', l4: 'calf', l5: 'hinge', l6: 'legiso',
  // Kettlebell
  k1: 'hinge', k2: 'squat', k3: 'overhead', k4: 'row', k5: 'hinge', k6: 'carry',
};

export function patternFor(exId) { return PATTERN[exId] || 'press'; }

export default function ExerciseFigure({ exId, color = '#e5e7eb', size = 200 }) {
  const pattern = patternFor(exId);
  const body = '#cbd5e1';      // figure
  const bw = 3.4;              // body stroke
  const ac = color;            // equipment / accent

  const plate = (cx, cy) => <circle cx={cx} cy={cy} r={5.5} fill={ac} stroke="none" />;
  const head = (cx, cy) => <circle cx={cx} cy={cy} r={7} fill="none" stroke={body} strokeWidth={bw} />;

  const F = { fill: 'none', stroke: body, strokeWidth: bw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const A = { fill: 'none', stroke: ac, strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round' };

  let content;
  switch (pattern) {
    case 'press': // bench press
      content = (<>
        <line x1="18" y1="82" x2="102" y2="82" {...F} />
        <line x1="30" y1="82" x2="30" y2="94" {...F} /><line x1="90" y1="82" x2="90" y2="94" {...F} />
        {head(34, 70)}
        <line x1="41" y1="72" x2="78" y2="74" {...F} />
        <line x1="55" y1="73" x2="56" y2="46" {...F} /><line x1="66" y1="73" x2="60" y2="46" {...F} />
        <line x1="40" y1="48" x2="80" y2="48" {...A} />{plate(40, 48)}{plate(80, 48)}
        <path d="M60 40 v-9 m-4 4 4 -4 4 4" {...A} />
      </>);
      break;
    case 'fly': // dumbbell flyes / pec deck
      content = (<>
        {head(60, 26)}
        <line x1="60" y1="33" x2="60" y2="70" {...F} />
        <line x1="60" y1="44" x2="30" y2="52" {...F} /><line x1="60" y1="44" x2="90" y2="52" {...F} />
        {plate(28, 53)}{plate(92, 53)}
        <path d="M40 44 q20 -14 40 0" {...A} strokeDasharray="3 4" />
        <line x1="60" y1="70" x2="50" y2="92" {...F} /><line x1="60" y1="70" x2="70" y2="92" {...F} />
      </>);
      break;
    case 'row': // bent-over row
      content = (<>
        {head(30, 34)}
        <line x1="35" y1="38" x2="86" y2="52" {...F} />
        <line x1="70" y1="47" x2="70" y2="70" {...A} />{plate(70, 72)}
        <path d="M70 46 v-10 m-4 5 4 -5 4 5" {...A} />
        <line x1="86" y1="52" x2="88" y2="90" {...F} />
        <line x1="86" y1="52" x2="70" y2="90" {...F} />
      </>);
      break;
    case 'pulldown': // lat pulldown
      content = (<>
        <line x1="24" y1="18" x2="96" y2="18" {...A} />{plate(24, 18)}{plate(96, 18)}
        {head(60, 40)}
        <line x1="48" y1="30" x2="42" y2="20" {...F} /><line x1="72" y1="30" x2="78" y2="20" {...F} />
        <line x1="60" y1="47" x2="60" y2="74" {...F} />
        <path d="M60 22 v9 m-4 -4 4 4 4 -4" {...A} />
        <line x1="52" y1="74" x2="52" y2="92" {...F} /><line x1="68" y1="74" x2="68" y2="92" {...F} />
      </>);
      break;
    case 'cable': // face pull / cable
      content = (<>
        <line x1="96" y1="16" x2="96" y2="60" {...A} strokeDasharray="4 4" />
        {head(44, 36)}
        <line x1="44" y1="43" x2="46" y2="78" {...F} />
        <line x1="46" y1="50" x2="88" y2="40" {...A} />{plate(90, 39)}
        <line x1="44" y1="78" x2="36" y2="94" {...F} /><line x1="46" y1="78" x2="56" y2="94" {...F} />
      </>);
      break;
    case 'squat': // squat / leg press
      content = (<>
        {head(60, 24)}
        <line x1="40" y1="34" x2="80" y2="34" {...A} />{plate(40, 34)}{plate(80, 34)}
        <line x1="60" y1="31" x2="60" y2="60" {...F} />
        <path d="M60 60 l-14 12 l4 20" {...F} />
        <path d="M60 60 l14 12 l-4 20" {...F} />
      </>);
      break;
    case 'legiso': // seated machine (extension/curl/abductor)
      content = (<>
        <line x1="34" y1="44" x2="34" y2="86" {...F} />
        <line x1="34" y1="86" x2="60" y2="86" {...F} />
        {head(30, 36)}
        <line x1="60" y1="86" x2="92" y2="70" {...F} />
        <line x1="92" y1="70" x2="94" y2="52" {...A} strokeWidth={7} />
        <path d="M78 88 q10 -6 16 -16" {...A} strokeDasharray="3 4" />
      </>);
      break;
    case 'calf': // calf raise
      content = (<>
        {head(60, 24)}
        <line x1="60" y1="31" x2="60" y2="66" {...F} />
        <line x1="60" y1="44" x2="46" y2="52" {...F} /><line x1="60" y1="44" x2="74" y2="52" {...F} />
        {plate(44, 54)}{plate(76, 54)}
        <line x1="60" y1="66" x2="56" y2="86" {...F} /><line x1="60" y1="66" x2="64" y2="86" {...F} />
        <line x1="50" y1="90" x2="70" y2="90" {...A} strokeWidth={5} />
        <path d="M84 78 v-16 m-4 5 4 -5 4 5" {...A} />
      </>);
      break;
    case 'hinge': // deadlift / swing / hyperextension
      content = (<>
        {head(34, 32)}
        <line x1="39" y1="36" x2="82" y2="46" {...F} />
        <line x1="82" y1="46" x2="80" y2="88" {...F} />
        <line x1="60" y1="41" x2="60" y2="74" {...A} />
        <circle cx="60" cy="80" r={8} fill={ac} stroke="none" /><path d="M54 74 h12" {...A} />
      </>);
      break;
    case 'overhead': // clean & press
      content = (<>
        {head(60, 40)}
        <line x1="60" y1="47" x2="60" y2="78" {...F} />
        <line x1="60" y1="52" x2="50" y2="30" {...F} /><line x1="60" y1="52" x2="70" y2="30" {...F} />
        <line x1="40" y1="22" x2="80" y2="22" {...A} />{plate(40, 22)}{plate(80, 22)}
        <path d="M60 40 v-9 m-4 4 4 -4 4 4" {...A} />
        <line x1="60" y1="78" x2="52" y2="96" {...F} /><line x1="60" y1="78" x2="68" y2="96" {...F} />
      </>);
      break;
    case 'carry': // farmer's carry
      content = (<>
        {head(60, 26)}
        <line x1="60" y1="33" x2="60" y2="72" {...F} />
        <line x1="60" y1="40" x2="42" y2="48" {...F} /><line x1="60" y1="40" x2="78" y2="48" {...F} />
        <line x1="40" y1="48" x2="40" y2="66" {...A} /><circle cx="40" cy="70" r={7} fill={ac} stroke="none" />
        <line x1="80" y1="48" x2="80" y2="66" {...A} /><circle cx="80" cy="70" r={7} fill={ac} stroke="none" />
        <line x1="60" y1="72" x2="52" y2="94" {...F} /><line x1="60" y1="72" x2="68" y2="94" {...F} />
      </>);
      break;
    default:
      content = head(60, 50);
  }

  return (
    <svg width={size} height={size * 0.86} viewBox="0 0 120 104" role="img" aria-label="Übungs-Illustration" style={{ maxWidth: '100%' }}>
      {content}
    </svg>
  );
}
