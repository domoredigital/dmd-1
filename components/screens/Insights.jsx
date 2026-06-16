import { useEffect } from 'react';

const STRENGTHS = ['Strategic thinker','Natural connector','Creative problem solver','Empathetic communicator','Visionary leader'];
const GROWTH    = ['Avoids difficult conversations','Perfectionism','Lack of consistency'];
const VALUES    = [['Freedom',92],['Impact',88],['Achievement',81],['Family',76],['Adventure',65]];
const THEMES    = [
  { icon: '🚀', name: 'Building confidence', count: '5 sessions' },
  { icon: '🧭', name: 'Finding purpose',     count: '4 sessions' },
  { icon: '💼', name: 'Career transitions',  count: '3 sessions' },
];

export default function Insights() {
  useEffect(() => {
    const bars = document.querySelectorAll('.val-bar');
    const t = setTimeout(() => {
      bars.forEach((b) => { b.style.width = b.getAttribute('data-w') + '%'; });
    }, 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ background: 'var(--black)', overflowY: 'auto', flex: 1, paddingBottom: 90 }}>
      <div style={{ padding: '18px 20px 13px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 3 }}>Your Insights</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Patterns from 7 conversations</div>
      </div>

      <Section title="Strengths">
        {STRENGTHS.map((s) => <Tag key={s} label={s} />)}
      </Section>

      <Section title="Core values">
        {VALUES.map(([label, pct]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 13, minWidth: 88 }}>{label}</span>
            <div style={{ flex: 1, height: 3, background: 'var(--s3)', borderRadius: 2, overflow: 'hidden' }}>
              <div className="val-bar" data-w={pct} style={{ height: 3, background: 'var(--gold)', borderRadius: 2, width: 0, transition: 'width 1.1s ease' }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 32, textAlign: 'right' }}>{pct}%</span>
          </div>
        ))}
      </Section>

      <Section title="Life themes">
        {THEMES.map((t) => (
          <div key={t.name} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--s2)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '10px 13px', marginBottom: 7 }}>
            <div style={{ width: 33, height: 33, borderRadius: 8, background: 'var(--s3)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{t.icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.count}</div>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Growth areas">
        {GROWTH.map((g) => <Tag key={g} label={g} color="var(--red)" />)}
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ padding: '13px 20px', borderBottom: '0.5px solid var(--border)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

function Tag({ label, color = 'var(--gold)' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', margin: '0 5px 5px 0', background: 'var(--s2)', border: '0.5px solid var(--border2)', borderRadius: 20, fontSize: 13 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}
