import { useState } from 'react';
import { useAuth } from '../lib/useAuth';
import SignInModal from './SignInModal';

export default function AccountButton() {
  const { user, loading, configured, signOut } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // If auth isn't configured at all, render nothing — app stays anonymous.
  if (!configured) return null;

  // Avoid a flash of the wrong state while the session is resolving.
  if (loading) return null;

  // Signed out: subtle, non-blocking "Save progress" entry point.
  if (!user) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'var(--s2)',
            border: '0.5px solid var(--border)',
            borderRadius: 20,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--gold)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Save progress
        </button>
        {showModal && <SignInModal onClose={() => setShowModal(false)} />}
      </>
    );
  }

  // Signed in: show initial + email, with a sign-out option.
  const email = user.email || '';
  const initial = (email[0] || '?').toUpperCase();

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowMenu((v) => !v)}
        aria-label="Account"
        aria-expanded={showMenu}
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'var(--gold3)',
          border: '0.5px solid var(--border2)',
          color: 'var(--gold)',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {initial}
      </button>

      {showMenu && (
        <>
          <div
            onClick={() => setShowMenu(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
          <div
            style={{
              position: 'absolute',
              top: 42,
              right: 0,
              zIndex: 50,
              minWidth: 210,
              background: 'var(--s1)',
              border: '0.5px solid var(--border2)',
              borderRadius: 12,
              padding: 8,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ padding: '8px 10px 10px', borderBottom: '0.5px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>Signed in as</div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600, wordBreak: 'break-all' }}>
                {email}
              </div>
            </div>
            <button
              onClick={async () => {
                setShowMenu(false);
                await signOut();
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                marginTop: 6,
                padding: '9px 10px',
                borderRadius: 8,
                background: 'transparent',
                border: 'none',
                color: 'var(--text)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
