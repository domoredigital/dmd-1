import { useState } from 'react';
import Logo from '../Logo';

const CARDS = [
  {
    key: 'guide_female',
    label: 'Female guide',
    desc: 'Warm, perceptive, easy to talk to',
    initial: 'F',
  },
  {
    key: 'guide_male',
    label: 'Male guide',
    desc: 'Grounded, direct, steady',
    initial: 'M',
  },
];

export default function VoiceGate({ onChoose }) {
  const [hovered, setHovered] = useState(null);

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
        Choose your guide.
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
          return (
            <button
              key={card.key}
              onClick={() => onChoose(card.key)}
              onMouseEnter={() => setHovered(card.key)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(card.key)}
              onBlur={() => setHovered(null)}
              aria-label={`${card.label} — ${card.desc}`}
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
                fontFamily: 'inherit',
                color: 'var(--fg, #fff)',
                boxShadow: isHover ? '0 8px 30px rgba(0,0,0,0.4)' : 'none',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--black)',
                  border: `1.5px solid ${isHover ? 'var(--gold)' : 'var(--border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                  fontWeight: 700,
                  color: isHover ? 'var(--gold)' : 'var(--muted)',
                  flexShrink: 0,
                  letterSpacing: '-0.5px',
                  transition: 'all 0.22s ease',
                }}
              >
                {card.initial}
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
            </button>
          );
        })}
      </div>
    </div>
  );
}
