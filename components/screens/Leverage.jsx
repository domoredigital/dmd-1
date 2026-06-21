import { useEffect, useState } from 'react';
import { loadActions, saveActions, setActionStatus } from '../../lib/store';

export default function Leverage({ data, loading, userTurns = 0, onRefresh }) {
  const [actions, setActions] = useState([]);   // all persisted actions
  const [celebrating, setCelebrating] = useState(null); // id mid-celebration

  // Load any previously suggested actions when the tab mounts.
  useEffect(() => { setActions(loadActions()); }, []);

  // Persist freshly suggested actions whenever new insights arrive.
  useEffect(() => {
    if (data?.actions && data.actions.length) {
      setActions(saveActions(data.actions));
    }
  }, [data]);

  const currentTexts = new Set((data?.actions || []).map((a) => a.text));
  // Follow-ups = still-open actions from a previous session that aren't being
  // re-suggested right now.
  const followUps = actions.filter((a) => a.status === 'open' && !currentTexts.has(a.text));
  const doneCount = actions.filter((a) => a.status === 'done').length;

  const hasData = data && (
    (data.actions && data.actions.length) ||
    (data.challenges && data.challenges.length) ||
    (data.recs && data.recs.length)
  );

  function markDone(id) {
    setCelebrating(id);
    setTimeout(() => {
      setActions(setActionStatus(id, 'done'));
      setCelebrating(null);
    }, 900);
  }

  return (
    <div style={{ background: 'var(--black)', overflowY: 'auto', flex: 1, paddingBottom: 90 }}>
      <div style={{ padding: '18px 20px 13px', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 3 }}>Leverage</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>
            {doneCount > 0 ? `${doneCount} action${doneCount === 1 ? '' : 's'} taken` : 'Personalized paths from your insights'}
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

      {/* Follow-up loop — open actions suggested in a previous session */}
      {followUps.length > 0 && (
        <div style={{ padding: '13px 20px', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 10 }}>Last time, I suggested…</div>
          {followUps.map((a) => (
            <FollowUpItem
              key={a.id}
              action={a}
              celebrating={celebrating === a.id}
              onDone={() => markDone(a.id)}
            />
          ))}
        </div>
      )}

      {!hasData && !loading && followUps.length === 0 && (
        <div style={{ padding: '60px 30px', textAlign: 'center' }}>
          <div style={{ fontSize: 34, marginBottom: 14 }}>🎯</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Your next moves are coming</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
            {userTurns > 0
              ? 'A few more conversations and I’ll map out specific actions built around what matters to you.'
              : 'Talk through a few questions first — then I’ll turn what you share into concrete next steps.'}
          </div>
        </div>
      )}

      {!hasData && loading && (
        <div style={{ padding: '60px 30px', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 14 }}>
            <div className="dot" /><div className="dot" /><div className="dot" />
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Building your paths…</div>
        </div>
      )}

      {hasData && (
        <>
          {!!(data.actions && data.actions.length) && (
            <LevSection title="Next best actions">
              {data.actions.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 23, height: 23, borderRadius: '50%', background: 'var(--gold)', color: '#000', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 14, lineHeight: 1.5 }}>{a.text}</div>
                    {a.note && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{a.note}</div>}
                  </div>
                </div>
              ))}
            </LevSection>
          )}

          {!!(data.challenges && data.challenges.length) && (
            <LevSection title="Personal challenges">
              {data.challenges.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--s2)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 7, cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{c.name}</div>
                    {c.meta && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.meta}</div>}
                  </div>
                  <span style={{ color: 'var(--dim)', fontSize: 16 }}>›</span>
                </div>
              ))}
            </LevSection>
          )}

          {!!(data.recs && data.recs.length) && (
            <LevSection title="Recommended for you">
              {data.recs.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', background: 'var(--s2)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '10px 13px', marginBottom: 7 }}>
                  <div style={{ width: 33, height: 33, borderRadius: 8, background: 'var(--s3)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>{r.emoji || '★'}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{r.title}</div>
                    {r.type && <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{r.type}</div>}
                  </div>
                </div>
              ))}
            </LevSection>
          )}
        </>
      )}
    </div>
  );
}

// One open follow-up action with "I did it" / "Not yet", plus a celebratory
// confirmation when completed.
function FollowUpItem({ action, celebrating, onDone }) {
  const [nudged, setNudged] = useState(false);

  if (celebrating) {
    return (
      <div
        className="celebrate-row"
        style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--s2)', border: '0.5px solid var(--gold)', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}
      >
        <span
          className="celebrate-check"
          style={{ width: 23, height: 23, borderRadius: '50%', background: 'var(--gold)', color: '#000', fontSize: 13, fontWeight: 800, flexShrink: 0 }}
        >
          ✓
        </span>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gold)' }}>Nice. That counts.</div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--s2)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
      <div style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 10 }}>{action.text}</div>
      {nudged ? (
        <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>No rush — it’s still here when you’re ready.</div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onDone}
            style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: 'var(--gold)', color: '#000', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            I did it
          </button>
          <button
            onClick={() => setNudged(true)}
            style={{ flex: 1, padding: '8px 0', borderRadius: 8, background: 'transparent', color: 'var(--muted)', border: '0.5px solid var(--border2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Not yet
          </button>
        </div>
      )}
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
