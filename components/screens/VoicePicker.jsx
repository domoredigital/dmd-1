import { useRef, useState } from 'react';
import Logo from '../Logo';
import { VOICES } from '../../lib/voices';

// Waveform bars — animated when playing, static otherwise
function Waveform({ active, color = 'var(--gold)' }) {
  const bars = [3, 6, 9, 7, 11, 8, 5, 10, 6, 4, 8, 5];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 16 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            width: 2,
            height: active ? h : 3,
            background: active ? color : 'var(--dim)',
            borderRadius: 2,
            transition: 'height 0.15s ease',
            animation: active ? `wave ${0.4 + (i % 4) * 0.1}s ease-in-out infinite alternate` : 'none',
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function VoicePicker({ selectedVoice, onSelect, onBegin }) {
  const currentAudio = useRef(null);
  const [playingId, setPlayingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  async function previewVoice(e, voice) {
    e.stopPropagation();

    // Stop any currently playing audio
    if (currentAudio.current) {
      currentAudio.current.pause();
      currentAudio.current = null;
      if (playingId === voice.id) {
        setPlayingId(null);
        return;
      }
    }

    setLoadingId(voice.id);
    setPlayingId(null);

    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: voice.preview, voiceId: voice.voiceId }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);

      // Read full response as ArrayBuffer for reliable mobile playback
      const arrayBuffer = await res.arrayBuffer();
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      const source = audioCtx.createBufferSource();
      source.buffer = decoded;
      source.connect(audioCtx.destination);

      setLoadingId(null);
      setPlayingId(voice.id);

      source.onended = () => {
        setPlayingId(null);
        audioCtx.close();
      };

      source.start(0);

      // Store a stop reference
      currentAudio.current = {
        pause: () => {
          try { source.stop(); } catch (_) {}
          audioCtx.close();
        }
      };
    } catch (err) {
      console.error('Preview error:', err);
      setLoadingId(null);
      setPlayingId(null);
    }
  }

  // Gender-initial + accent color per voice — premium minimal
  const VOICE_ACCENTS = ['#8B6914', '#185FA5', '#0F6E56', '#A32D2D', '#72243E'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '44px 22px 28px', overflowY: 'auto', flex: 1 }}>
      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.5); }
          to   { transform: scaleY(1.4); }
        }
      `}</style>

      <Logo />

      <p style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', margin: '14px 0 6px', lineHeight: 1.6 }}>
        Pick the voice that will guide you.<br />Tap play to hear each one.
      </p>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, background: 'var(--s2)', border: '0.5px solid var(--border2)', fontSize: 11, color: 'var(--gold)', marginBottom: 20, fontWeight: 600, letterSpacing: '0.3px' }}>
        ⚡ Powered by ElevenLabs AI
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
        {VOICES.map((voice, idx) => {
          const isPlaying = playingId === voice.id;
          const isLoading = loadingId === voice.id;
          const isSelected = selectedVoice?.id === voice.id;
          const accent = VOICE_ACCENTS[idx] || 'var(--gold)';

          return (
            <div
              key={voice.id}
              className={`vc${isSelected ? ' selected' : ''}`}
              onClick={() => onSelect(voice)}
              style={{ gap: 14 }}
            >
              {/* Initial circle — clean, no emoji */}
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--s3)',
                border: `1.5px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                fontWeight: 700,
                color: isSelected ? 'var(--gold)' : 'var(--muted)',
                flexShrink: 0,
                letterSpacing: '-0.5px',
                transition: 'all 0.2s',
              }}>
                {voice.name[0]}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>
                    {voice.name}
                  </span>
                  {voice.isNew && (
                    <span style={{ fontSize: 9, background: 'var(--gold)', color: '#000', padding: '2px 6px', borderRadius: 8, fontWeight: 800, letterSpacing: '0.5px' }}>
                      NEW
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{voice.desc}</div>
                {/* Waveform — animates when playing */}
                <Waveform active={isPlaying} />
              </div>

              {/* Play button */}
              <button
                onClick={(e) => previewVoice(e, voice)}
                aria-label={isPlaying ? `Stop ${voice.name}` : `Preview ${voice.name}`}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: `1px solid ${isPlaying ? 'var(--gold)' : 'var(--border2)'}`,
                  background: isPlaying ? 'var(--gold)' : 'transparent',
                  color: isPlaying ? '#000' : 'var(--gold)',
                  fontSize: isLoading ? 11 : 13,
                  cursor: 'pointer',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.18s',
                  fontFamily: 'inherit',
                }}
              >
                {isLoading ? '...' : isPlaying ? '■' : '▶'}
              </button>

              {/* Select check */}
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: `1.5px solid ${isSelected ? 'var(--gold)' : 'var(--border2)'}`,
                background: isSelected ? 'var(--gold)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                color: isSelected ? '#000' : 'transparent',
                flexShrink: 0,
                transition: 'all 0.2s',
                fontWeight: 700,
              }}>
                ✓
              </div>
            </div>
          );
        })}
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
