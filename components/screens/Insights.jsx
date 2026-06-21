import { useEffect, useState } from 'react';

export default function Insights({ data, loading, userTurns = 0, onRefresh }) {
  const [animate, setAnimate] = useState(false);

  // Animate the value bars once data is present.
  useEffect(() => {
    if (!data) return;
    setAnimate(false);
    const t = setTimeout(() => setAnimate(true), 150);
    return () => clearTimeout(t);
  }, [data]);

  const hasData = data && (
    (data.strengths && data.strengths.length) ||
    (data.values && data.values.length) ||
    (data.themes && data.themes.length)
  );

  return (
    <div style={{ background: 'var(--black)', overflowY: 'auto', flex: 1, paddingBottom: 90 }}>
      <div style={{ padding: '18px 20px 13px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 3 }}>Your Insights</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {hasData ? 'What I’m noticing about you' : 'Patterns from your conversations'}
          </div>
        </div>
        {hasData && onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{ padding: '5px 11px', borderRadius: 20, background: 'var(--s2)', border: '0.5px solid var(--border)', fontSize: 11, color: 'var(--muted)', cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'Updating…' : 'Refresh'}
          </button>
        )}
      </div>

      {/* Empty state — not enough conversation yet */}
      {!hasData && !loading && (
        <div style={{ padding: '60px 30px', textAlign: 'center' }}>
          <div style={{ fontSize: 34, marginBottom: 14 }}>🪞</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Your mirror is still forming</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
            {userTurns > 0
              ? 'Have a few more conversations and I’ll start reflecting back what I notice about you.'
              : 'Once you’ve talked through a few questions, your strengths, values, and themes will appear here.'}
          </div>
        </div>
      )}

      {/* Loading — first analysis */}
      {!hasData && loading && (
        <div style={{ padding: '60px 30px', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 14 }}>
            <div className="dot" /><div className="dot" /><div className="dot" />
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Reading your conversations…</div>
        </div>
      )}

      {hasData && (
        <>
          {/* The honest mirror — what they may not be seeing */}
          {!!data.honest_observation && (
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--border)' }}>
              <div style={{ background: 'var(--s2)', border: '0.5px solid var(--gold)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 7 }}>Something I noticed…</div>
                <div style={{ fontSize: 14, lineHeight: 1.55 }}>{data.honest_observation}</div>
              </div>
            </div>
          )}

          {/* Cross-session shift — only present with more than one session */}
          {!!data.shift && (
            <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--border)' }}>
              <div style={{ background: 'var(--s2)', border: '0.5px solid var(--border2)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 7 }}>What’s changed…</div>
                <div style={{ fontSize: 14, lineHeight: 1.55 }}>{data.shift}</div>
              </div>
            </div>
          )}

          {!!(data.strengths && data.strengths.length) && (
            <Section title="Strengths">
              {data.strengths.map((s, i) => (
                <ReceiptItem key={i} label={s.text} quote={s.quote} />
              ))}
            </Section>
          )}

          {!!(data.values && data.values.length) && (
            <Section title="Core values">
              {data.values.map((v, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, minWidth: 88 }}>{v.label}</span>
                    <div style={{ flex: 1, height: 3, background: 'var(--s3)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: 3, background: 'var(--gold)', borderRadius: 2, width: animate ? `${v.pct}%` : 0, transition: 'width 1.1s ease' }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--muted)', minWidth: 32, textAlign: 'right' }}>{v.pct}%</span>
                  </div>
                  {v.quote && <Receipt quote={v.quote} />}
                </div>
              ))}
            </Section>
          )}

          {!!(data.themes && data.themes.length) && (
            <Section title="Life themes">
              {data.themes.map((t, i) => (
                <div key={i} style={{ background: 'var(--s2)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '10px 13px', marginBottom: 7 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 33, height: 33, borderRadius: 8, background: 'var(--s3)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{t.emoji || '•'}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{t.name}</div>
                      {t.note && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{t.note}</div>}
                    </div>
                  </div>
                  {t.quote && <Receipt quote={t.quote} />}
                </div>
              ))}
            </Section>
          )}

          {!!(data.growth && data.growth.length) && (
            <Section title="Growth areas">
              {data.growth.map((g, i) => (
                <ReceiptItem key={i} label={g.text} quote={g.quote} color="var(--red)" />
              ))}
            </Section>
          )}
        </>
      )}
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

// A subtle italic "receipt" — the user's own words backing an observation.
function Receipt({ quote }) {
  return (
    <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', marginTop: 6, paddingLeft: 9, borderLeft: '2px solid var(--border2)', lineHeight: 1.45 }}>
      “{quote}”
    </div>
  );
}

// A labeled tag with an optional quote receipt underneath.
function ReceiptItem({ label, quote, color = 'var(--gold)' }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <Tag label={label} color={color} />
      {quote ? <Receipt quote={quote} /> : null}
    </div>
  );
}

function Tag({ label, color = 'var(--gold)' }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'var(--s2)', border: '0.5px solid var(--border2)', borderRadius: 20, fontSize: 13 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}
