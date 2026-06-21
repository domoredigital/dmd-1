import { useState, useRef, useEffect } from 'react';
import Logo from '../Logo';
import Orb from '../Orb';
import { VOICE_IDS } from '../../lib/agentConfig';

const CARDS = [
  {
    key: 'guide_female',
    label: 'Female guide',
    desc: 'Warm, perceptive, easy to talk to',
    palette: 'femaleGuide',
    voiceId: VOICE_IDS.female,
    sample: "Hi, I'm really glad you're here. Take your time — what's on your mind today?",
  },
  {
    key: 'guide_male',
    label: 'Male guide',
    desc: 'Grounded, direct, steady',
    palette: 'maleGuide',
    voiceId: VOICE_IDS.male,
    sample: "Hey, good to meet you. Whenever you're ready, let's get into what matters to you.",
  },
];

export default function VoiceGate({ onChoose }) {
  const [hovered, setHovered] = useState(null);
  const [previewing, setPreviewing] = useState(null);   // card key currently playing
  const [loading, setLoading] = useState(null);         // card key fetching audio
  const audioRef = useRef(null);

  // Stop and release audio on unmount.
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  function stopPreview() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPreviewing(null);
  }

  async function playPreview(card) {
    // Tapping the playing orb stops it.
    if (previewing === card.key) {
      stopPreview();
      return;
    }
    stopPreview();
    setLoading(card.key);
    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: card.sample, voiceId: card.voiceId }),
      });
      if (!res.ok) throw new Error('preview failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (!audioRef.current) audioRef.current = new Audio();
      const audio = audioRef.current;
      audio.src = url;
      audio.onended = () => { setPreviewing(null); URL.revokeObjectURL(url); };
      audio.onerror = () => { setPreviewing(null); URL.revokeObjectURL(url); };
      await audio.play();
      setPreviewing(card.key);
    } catch (_) {
      setPreviewing(null);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '44px 22px 28px',
        overflowY: 'auto',
        flex: 1,
      }}
    >
      <Logo />

      <p
        style={{
          fontSize: 15,
          color: 'var(--muted)',
          textAlign: 'center',
          margin: '16px 0 28px',
          lineHeight: 1.6,
          fontWeight: 500,
        }}
      >
        Choose your guide. Tap an orb to hear their voice.
      </p>

      <div
        style={{
          width: '100%',
          maxWidth: 520,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {CARDS.map((card) => {
          const isHover = hovered === card.key;
          const isPlaying = previewing === card.key;
          const isLoading = loading === card.key;
          return (
            <div
              key={card.key}
              role="button"
              tabIndex={0}
              onClick={() => onChoose(card.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChoose(card.key); }
              }}
              onMouseEnter={() => setHovered(card.key)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(card.key)}
              onBlur={() => setHovered(null)}
              aria-label={`${card.label} — ${card.desc}. Select to begin.`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                width: '100%',
                textAlign: 'left',
                padding: '26px 24px',
                borderRadius: 18,
                background: isHover ? 'var(--s3)' : 'var(--s2)',
                border: `1.5px solid ${isHover ? 'var(--gold)' : 'var(--border)'}`,
                cursor: 'pointer',
                transition: 'all 0.22s ease',
                color: 'var(--fg, #fff)',
                boxShadow: isHover ? '0 8px 30px rgba(0,0,0,0.4)' : 'none',
              }}
            >
              {/* Orb doubles as the voice-preview control */}
              <div style={{ position: 'relative', flexShrink: 0, width: 60, height: 60 }}>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    boxShadow: isPlaying
                      ? '0 0 0 1.5px var(--gold), 0 0 20px rgba(212,175,90,0.4)'
                      : isHover
                        ? '0 0 0 1.5px var(--gold), 0 6px 18px rgba(0,0,0,0.45)'
                        : '0 0 0 1px var(--border)',
                    transition: 'box-shadow 0.22s ease',
                  }}
                >
                  <Orb palette={card.palette} size={60} decorative />
                </div>
                <button
                  type="button"
                  aria-label={isPlaying ? `Stop ${card.label} preview` : `Preview ${card.label} voice`}
                  onClick={(e) => { e.stopPropagation(); playPreview(card); }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    background: isPlaying
                      ? 'rgba(0,0,0,0.45)'
                      : isHover
                        ? 'rgba(0,0,0,0.3)'
                        : 'rgba(0,0,0,0.12)',
                    color: '#fff',
                    transition: 'background 0.22s ease',
                  }}
                >
                  {isLoading ? <Spinner /> : isPlaying ? <StopIcon /> : <PlayIcon />}
                </button>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 700,
                    marginBottom: 5,
                    letterSpacing: '-0.2px',
                  }}
                >
                  {card.label}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
                  {card.desc}
                </div>
                <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 6 }}>
                  {isLoading ? 'Loading preview…' : isPlaying ? 'Playing preview…' : 'Tap the orb to hear this voice'}
                </div>
              </div>

              <span
                aria-hidden="true"
                style={{
                  fontSize: 20,
                  color: isHover ? 'var(--gold)' : 'var(--dim)',
                  flexShrink: 0,
                  transition: 'all 0.22s ease',
                  transform: isHover ? 'translateX(2px)' : 'none',
                }}
              >
                →
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="#fff" strokeWidth="3" strokeLinecap="round">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="0.7s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}
