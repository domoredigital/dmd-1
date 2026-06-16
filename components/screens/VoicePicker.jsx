import { useRef } from 'react';
import Logo from '../Logo';
import { VOICES } from '../../lib/voices';

export default function VoicePicker({ selectedVoice, onSelect, onBegin }) {
  const currentAudio = useRef(null);

  async function previewVoice(e, voice) {
    e.stopPropagation();
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
    }

    const btn = e.currentTarget;
    btn.textContent = '⏳';

    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: voice.preview, voiceId: voice.voiceId }),
      });

      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudio.current = audio;

      btn.textContent = '⏸';
      audio.onended = () => { btn.textContent = '▶'; URL.revokeObjectURL(url); };
      audio.play();
    } catch {
      btn.textContent = '▶';
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '44px 22px 28px', overflowY: 'auto', flex: 1 }}>
      <Logo />

      <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', margin: '14px 0 6px', lineHeight: 1.55 }}>
        Pick the voice that will guide you.<br />Tap play to hear each one.
      </p>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: 'var(--s2)', border: '0.5px solid var(--border2)', fontSize: 11, color: 'var(--gold)', marginBottom: 18, fontWeight: 600 }}>
        ⚡ Powered by ElevenLabs AI
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {VOICES.map((voice) => (
          <div
            key={voice.id}
            className={`vc${selectedVoice?.id === voice.id ? ' selected' : ''}`}
            onClick={() => onSelect(voice)}
          >
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: voice.bg, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              {voice.emoji}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 1 }}>
                {voice.name}
                {voice.isNew && (
                  <span style={{ fontSize: 10, background: 'var(--gold)', color: '#000', padding: '2px 7px', borderRadius: 10, fontWeight: 700, verticalAlign: 'middle', letterSpacing: '0.3px', marginLeft: 7 }}>
                    NEW
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 2 }}>{voice.desc}</div>
              <div style={{ fontSize: 10, color: 'var(--gold)', fontWeight: 600, letterSpacing: '0.5px' }}>ELEVENLABS · ULTRA REALISTIC</div>
            </div>

            <button
              onClick={(e) => previewVoice(e, voice)}
              aria-label={`Preview ${voice.name}`}
              style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--border2)', background: 'transparent', color: 'var(--gold)', fontSize: 14, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ▶
            </button>

            <div style={{ width: 19, height: 19, borderRadius: '50%', border: `1.5px solid ${selectedVoice?.id === voice.id ? 'var(--gold)' : 'var(--border2)'}`, background: selectedVoice?.id === voice.id ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: selectedVoice?.id === voice.id ? '#000' : 'transparent', flexShrink: 0, transition: 'all 0.2s' }}>
              ✓
            </div>
          </div>
        ))}
      </div>

      <button
        className={`cta-btn${selectedVoice ? ' ready' : ''}`}
        onClick={onBegin}
      >
        Let's begin →
      </button>
    </div>
  );
}
