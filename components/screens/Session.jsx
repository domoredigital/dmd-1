import { useState, useEffect, useRef, useCallback } from 'react';
import Orb from '../Orb';
import { PERSONAS } from '../../lib/voices';
import { ONBOARD_STEPS, SESSION_OPENERS } from '../../lib/onboard';
import { useVoice } from '../../lib/useVoice';

const PERSONA_LIST = [
  { name: 'The Mentor',      emoji: '🧭', desc: 'Wise, insightful, experienced' },
  { name: 'The Coach',       emoji: '⚡', desc: 'Direct, motivating, action-oriented' },
  { name: 'Best Friend',     emoji: '🤝', desc: 'Warm, supportive, encouraging' },
  { name: 'The Challenger',  emoji: '🔥', desc: 'Pushes you beyond comfort zones' },
  { name: 'Therapist Guide', emoji: '🌿', desc: 'Reflective, emotionally intelligent' },
  { name: 'Sofia Mode',      emoji: '✨', desc: 'Charming, magnetic, deeply engaging' },
];

export default function Session({ voice, persona, setPersona, userData, topic, isOnboard, onOnboardComplete, onBack }) {
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [chips, setChips] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [step, setStep] = useState(0);
  const [localUserData, setLocalUserData] = useState(userData || {});
  const [showModal, setShowModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const transcriptRef = useRef(null);
  const initializedRef = useRef(false);

  const addMessage = useCallback((role, text) => {
    setMessages((prev) => [...prev, { role, text, id: Date.now() + Math.random() }]);
    setHistory((prev) => [...prev, { role: role === 'ai' ? 'assistant' : 'user', content: text }]);
    setTimeout(() => {
      if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }, 50);
  }, []);

  const handleAnswer = useCallback(async (text) => {
    if (!text.trim()) return;
    setChips(null);
    addMessage('user', text);

    if (isOnboard) {
      const currentStep = ONBOARD_STEPS[step];
      const newData = { ...localUserData, [currentStep.key]: text };
      setLocalUserData(newData);

      const nextStep = step + 1;
      if (nextStep < ONBOARD_STEPS.length) {
        setStep(nextStep);
      } else {
        // Onboard complete
        const outro = `Thank you, ${newData.name || 'friend'}. I already know this is going to be powerful. I'm ready when you are — let's do more.`;
        setTimeout(() => {
          addMessage('ai', outro);
          speak(outro).then(() => {
            setTimeout(() => onOnboardComplete(newData), 1400);
          });
        }, 300);
        return;
      }
   } else {
      // Live session — hit /api/chat
      setIsGenerating(true);
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...history, { role: 'user', content: text }],
            persona,
            userData: localUserData,
            topic,
          }),
        });
        const data = await res.json();
        setIsGenerating(false);
        const reply = data.reply || "I'm here with you. Tell me more.";
        addMessage('ai', reply);
        // Show one-tap suggested replies once the persona finishes speaking.
        speak(reply).then(() => {
          if (Array.isArray(data.suggestions) && data.suggestions.length) {
            setChips(data.suggestions);
          }
        });
      } catch {
        setIsGenerating(false);
        const fallback = "I'm here with you. Tell me more.";
        addMessage('ai', fallback);
        speak(fallback);
      }
    }
  }, [isOnboard, step, localUserData, history, persona, topic, addMessage]);

  const { orbState, hint, speak, toggleListen } = useVoice({
    voiceId: voice.voiceId,
    onTranscript: handleAnswer,
  });

  // Kick off onboarding or session opener on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const firstQ = isOnboard
      ? ONBOARD_STEPS[0].q
      : SESSION_OPENERS[topic] || `Let's explore ${topic?.toLowerCase() || 'self-discovery'} together. What comes to mind first?`;

    setTimeout(() => {
      addMessage('ai', firstQ);
      speak(firstQ).then(() => {
        if (isOnboard && ONBOARD_STEPS[0].chips) setChips(ONBOARD_STEPS[0].chips);
      });
    }, 350);
  }, []);

  // Advance onboard questions when step changes
  useEffect(() => {
    if (!isOnboard || step === 0) return;
    const nextQ = ONBOARD_STEPS[step];
    if (!nextQ) return;

    setTimeout(() => {
      addMessage('ai', nextQ.q);
      speak(nextQ.q).then(() => {
        if (nextQ.chips) setChips(nextQ.chips);
      });
    }, 400);
  }, [step]);

  const avatarInit = voice.name[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: 'var(--black)', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', color: 'var(--gold)', textTransform: 'uppercase' }}>
          {isOnboard ? 'Getting started' : (topic || 'Session')}
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ padding: '5px 10px', borderRadius: 20, background: 'var(--s2)', border: '0.5px solid var(--border)', fontSize: 11, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          {persona} ▾
        </button>
      </div>

      {/* Transcript */}
      <div
        ref={transcriptRef}
        style={{ flex: 1, overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 280 }}
      >
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', gap: 9, alignItems: 'flex-end', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', animation: 'pop 0.28s ease' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: msg.role === 'user' ? 'var(--gold)' : 'var(--s3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0, color: msg.role === 'user' ? '#000' : 'var(--gold)', fontWeight: 700 }}>
              {msg.role === 'user' ? (localUserData.name || 'U')[0].toUpperCase() : avatarInit}
            </div>
            <div className={`bub ${msg.role}`}>{msg.text}</div>
          </div>
        ))}

        {isGenerating && (
          <div style={{ display: 'flex', gap: 9, alignItems: 'flex-end' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--s3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--gold)', fontWeight: 700, flexShrink: 0 }}>{avatarInit}</div>
            <div style={{ display: 'flex', gap: 5, padding: '11px 15px', background: 'var(--s2)', border: '0.5px solid var(--border)', borderRadius: 18, borderBottomLeftRadius: 4 }}>
              <div className="dot" /><div className="dot" /><div className="dot" />
            </div>
          </div>
        )}
      </div>

      {/* Voice stage */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 20px 16px', gap: 9 }}>
        {chips && (
          <div style={{ display: 'flex', gap: 7, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
            {chips.map((chip) => (
              <div key={chip} className="vchip" onClick={() => { setChips(null); handleAnswer(chip); }}>{chip}</div>
            ))}
          </div>
        )}
        {chips && <div style={{ fontSize: 11, color: 'var(--dim)' }}>— or type below —</div>}

        {orbState === 'speaking' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'var(--s2)', border: '0.5px solid var(--border)', borderRadius: 20, fontSize: 12, color: 'var(--muted)' }}>
            <div className="dot" style={{ background: 'var(--gold)' }} />
            <span>Generating voice…</span>
          </div>
        )}

        <Orb state={orbState} hint={hint} onClick={toggleListen} />
      </div>

      {/* Text fallback */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '0 20px 20px' }}>
        <input
          className="tf-inp"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && textInput.trim()) { handleAnswer(textInput); setTextInput(''); } }}
          placeholder="Or type here…"
          aria-label="Type your answer"
        />
        <button
          onClick={() => { if (textInput.trim()) { handleAnswer(textInput); setTextInput(''); } }}
          style={{ width: 37, height: 37, borderRadius: '50%', background: 'var(--gold)', border: 'none', color: '#000', fontSize: 18, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Send"
        >
          ›
        </button>
      </div>

      {/* Persona modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ background: 'var(--s1)', border: '0.5px solid var(--border)', borderRadius: '24px 24px 0 0', padding: 18, width: '100%', maxWidth: 430 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: 32, height: 3, background: 'var(--s3)', borderRadius: 2, margin: '0 auto 16px' }} />
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 13 }}>Choose your AI style</div>
            {PERSONA_LIST.map((p) => (
              <div
                key={p.name}
                onClick={() => { setPersona(p.name); setShowModal(false); }}
                style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 13px', borderRadius: 10, border: `0.5px solid ${persona === p.name ? 'var(--gold)' : 'var(--border)'}`, background: 'var(--s2)', marginBottom: 7, cursor: 'pointer' }}
              >
                <span style={{ fontSize: 20, width: 34, textAlign: 'center' }}>{p.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: persona === p.name ? 'var(--gold)' : 'var(--text)', marginBottom: 1 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
