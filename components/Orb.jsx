export default function Orb({ state, onClick, hint }) {
  // state: 'idle' | 'listening' | 'speaking'
  const showRings = state === 'listening' || state === 'speaking';

  const icon =
    state === 'listening' ? '⏹' :
    state === 'speaking'  ? '🔊' :
    '🎤';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: 108, height: 108, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {showRings && (
          <>
            <div className="orb-ring" style={{ width: 108, height: 108 }} />
            <div className="orb-ring" style={{ width: 130, height: 130, animationDelay: '0.4s' }} />
            <div className="orb-ring" style={{ width: 152, height: 152, animationDelay: '0.8s' }} />
          </>
        )}
        <button
          className={`orb ${state}`}
          onClick={onClick}
          aria-label={state === 'listening' ? 'Stop listening' : 'Tap to speak'}
          style={{ border: 'none', fontSize: 26, zIndex: 2 }}
        >
          {icon}
        </button>
      </div>
      <p
        style={{
          fontSize: 13,
          color: state !== 'idle' ? 'var(--gold)' : 'var(--muted)',
          textAlign: 'center',
          minHeight: 18,
          transition: 'color 0.2s',
        }}
      >
        {hint}
      </p>
    </div>
  );
}
