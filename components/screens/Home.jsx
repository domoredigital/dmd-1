import Logo from '../Logo';
import { DAILY_QUESTIONS } from '../../lib/onboard';
import { useMemo } from 'react';

const CATEGORIES = ['Identity','Purpose','Career','Money','Relationships','Confidence','Leadership','Health'];

export default function Home({ userData, onGoSession }) {
  const dailyQ = useMemo(() => {
    const idx = new Date().getDay() % DAILY_QUESTIONS.length;
    return DAILY_QUESTIONS[idx];
  }, []);

  return (
    <div style={{ background: 'var(--black)', overflowY: 'auto', flex: 1, paddingBottom: 90 }}>
      <div style={{ padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>
          Hey, <span style={{ color: 'var(--gold)' }}>{userData?.name || 'friend'}</span> ✦
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--s2)', border: '0.5px solid var(--border)', borderRadius: 20, padding: '5px 10px', fontSize: 12, color: 'var(--muted)' }}>
          🔥 <b style={{ color: 'var(--gold)' }}>3</b> days
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
        <Logo scale={0.72} />
      </div>

      {/* Daily question */}
      <div className="dq-card" style={{ margin: '13px 20px' }} onClick={() => onGoSession('Daily Question')}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}>Today's question</div>
        <div style={{ fontSize: 16, fontWeight: 500, lineHeight: 1.4, marginBottom: 11 }}>{dailyQ}</div>
        <div style={{ fontSize: 13, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>Speak on this</span><span>→</span>
        </div>
      </div>

      {/* Quick access */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--muted)', textTransform: 'uppercase', padding: '0 20px', margin: '11px 0 9px' }}>Quick access</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 20px' }}>
        {[
          { icon: '💬', title: 'Continue talking', sub: 'Resume your last session', topic: 'Continue' },
          { icon: '✨', title: 'Start a new session', sub: 'Pick a topic and dive in', topic: 'New Session' },
        ].map((item) => (
          <div key={item.topic} className="qcard" onClick={() => onGoSession(item.topic)}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--s3)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 1 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{item.sub}</div>
            </div>
            <span style={{ color: 'var(--dim)', marginLeft: 'auto', fontSize: 16 }}>›</span>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--muted)', textTransform: 'uppercase', padding: '0 20px', margin: '13px 0 9px' }}>Explore topics</div>
      <div style={{ display: 'flex', gap: 7, padding: '0 20px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {CATEGORIES.map((cat) => (
          <div
            key={cat}
            className="cat"
            onClick={() => onGoSession(cat)}
            style={{ padding: '7px 13px', borderRadius: 20, border: '0.5px solid var(--border)', background: 'var(--s2)', fontSize: 12, fontWeight: 500, color: 'var(--muted)', whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0 }}
          >
            {cat}
          </div>
        ))}
      </div>
    </div>
  );
}
