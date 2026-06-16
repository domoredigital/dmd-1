const ACTIONS = [
  { text: 'Start a daily 10-minute journaling practice with one focused question each morning.', note: 'Builds on your reflective strength' },
  { text: "Schedule one difficult conversation you've been avoiding — this week.", note: 'Targets your top growth area' },
  { text: 'Reach out to one person in your network who aligns with your purpose.', note: 'Leverages your connector strength' },
];

const CHALLENGES = [
  { name: '7-Day Confidence Builder', days: '7 days · Daily voice prompts' },
  { name: 'Networking Challenge',     days: '14 days · 2 actions/week' },
  { name: 'Consistency Sprint',       days: '21 days · Morning ritual' },
];

const RECS = [
  { icon: '📖', title: 'The Gap and the Gain',    type: 'Book · High match' },
  { icon: '🎧', title: 'How I Built This',         type: 'Podcast · Career growth' },
  { icon: '🎓', title: 'Public Speaking Mastery',  type: 'Course · Confidence' },
];

export default function Leverage() {
  return (
    <div style={{ background: 'var(--black)', overflowY: 'auto', flex: 1, paddingBottom: 90 }}>
      <div style={{ padding: '18px 20px 13px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 3 }}>Leverage</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>Personalized paths from your insights</div>
      </div>

      <LevSection title="Next best actions">
        {ACTIONS.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 23, height: 23, borderRadius: '50%', background: 'var(--gold)', color: '#000', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
            <div>
              <div style={{ fontSize: 14, lineHeight: 1.5 }}>{a.text}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{a.note}</div>
            </div>
          </div>
        ))}
      </LevSection>

      <LevSection title="Personal challenges">
        {CHALLENGES.map((c) => (
          <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--s2)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 7, cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.days}</div>
            </div>
            <span style={{ color: 'var(--dim)', fontSize: 16 }}>›</span>
          </div>
        ))}
      </LevSection>

      <LevSection title="Recommended for you">
        {RECS.map((r) => (
          <div key={r.title} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--s2)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '10px 13px', marginBottom: 7 }}>
            <div style={{ width: 33, height: 33, borderRadius: 8, background: 'var(--s3)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{r.icon}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{r.title}</div>
              <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{r.type}</div>
            </div>
          </div>
        ))}
      </LevSection>
    </div>
  );
}

function LevSection({ title, children }) {
  return (
    <div style={{ padding: '13px 20px', borderBottom: '0.5px solid var(--border)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}
