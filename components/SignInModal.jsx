import { useState } from 'react';
import { useAuth } from '../lib/useAuth';

export default function SignInModal({ onClose }) {
  const { signInWithEmail, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleSend(e) {
    e.preventDefault();
    if (!emailValid || status === 'sending') return;
    setStatus('sending');
    setError('');
    try {
      await signInWithEmail(email.trim());
      setStatus('sent');
    } catch (err) {
      setError(err?.message || 'Could not send the link. Try again.');
      setStatus('error');
    }
  }

  async function handleGoogle() {
    setError('');
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err?.message || 'Google sign-in is unavailable right now.');
      setStatus('error');
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Save your progress"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'var(--s1)',
          border: '0.5px solid var(--border2)',
          borderRadius: 18,
          padding: '26px 22px 22px',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            fontSize: 20,
            cursor: 'pointer',
            lineHeight: 1,
            fontFamily: 'inherit',
          }}
        >
          ×
        </button>

        {status === 'sent' ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                margin: '0 auto 14px',
                background: 'var(--gold3)',
                border: '0.5px solid var(--border2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                color: 'var(--gold)',
              }}
            >
              ✦
            </div>
            <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.3px' }}>
              Check your email
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
              We sent a sign-in link to <b style={{ color: 'var(--text)' }}>{email.trim()}</b>. Tap it
              and you&apos;ll land right back here, signed in.
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: 18,
                width: '100%',
                padding: '11px 0',
                borderRadius: 10,
                background: 'transparent',
                color: 'var(--muted)',
                border: '0.5px solid var(--border)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, letterSpacing: '-0.4px' }}>
              Save your progress
            </div>
            <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 18 }}>
              Save your conversations and insights — no password needed.
            </div>

            <form onSubmit={handleSend}>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  borderRadius: 10,
                  background: 'var(--black)',
                  border: '0.5px solid var(--border)',
                  color: 'var(--text)',
                  fontSize: 15,
                  fontFamily: 'inherit',
                  outline: 'none',
                  marginBottom: 10,
                }}
              />
              <button
                type="submit"
                disabled={!emailValid || status === 'sending'}
                style={{
                  width: '100%',
                  padding: '13px 0',
                  borderRadius: 10,
                  background: emailValid ? 'var(--gold)' : 'var(--s3)',
                  color: emailValid ? '#000' : 'var(--dim)',
                  border: 'none',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: emailValid && status !== 'sending' ? 'pointer' : 'default',
                  fontFamily: 'inherit',
                  transition: 'background 0.2s ease, color 0.2s ease',
                }}
              >
                {status === 'sending' ? 'Sending…' : 'Send me a link'}
              </button>
            </form>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                margin: '16px 0',
                color: 'var(--dim)',
                fontSize: 12,
              }}
            >
              <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
              or
              <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
            </div>

            <button
              onClick={handleGoogle}
              style={{
                width: '100%',
                padding: '12px 0',
                borderRadius: 10,
                background: 'transparent',
                color: 'var(--text)',
                border: '0.5px solid var(--border)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
              }}
            >
              <GoogleMark />
              Continue with Google
            </button>

            {error && (
              <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--red)', lineHeight: 1.4 }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: 16, fontSize: 11.5, color: 'var(--dim)', textAlign: 'center', lineHeight: 1.5 }}>
              Optional — the app works fully without an account.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}
