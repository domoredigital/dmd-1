import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useConversation, ConversationProvider } from '@elevenlabs/react';
import Orb from '../Orb';
import { buildOverrides, PERSONAS, ANON_MAX_SECONDS } from '../../lib/agentConfig';
import {
  appendMessage,
  saveSessions,
  loadSessions,
  saveUserData,
  loadUserData,
} from '../../lib/store';

// Pull a likely first name out of a short user utterance like
// "It's Marcus" / "I'm Marcus" / "Marcus" / "My name is Marcus".
function extractName(text) {
  if (!text) return null;
  const cleaned = String(text).trim().replace(/[.!?,]+$/, '');
  const m = cleaned.match(
    /(?:my name is|i am|i'm|it's|its|call me|this is)\s+([A-Za-z][A-Za-z'-]{1,20})/i
  );
  let candidate = m ? m[1] : null;
  // Fall back to a single-word reply (the name-asking firstMessage invites this).
  if (!candidate) {
    const words = cleaned.split(/\s+/);
    if (words.length <= 2 && /^[A-Za-z][A-Za-z'-]{1,20}$/.test(words[words.length - 1])) {
      candidate = words[words.length - 1];
    }
  }
  if (!candidate) return null;
  return candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
}

function SessionInner({ personaKey, onBack }) {
  const persona = PERSONAS[personaKey] || PERSONAS.guide_female;

  const [transcript, setTranscript] = useState([]);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);

  const sessionIdRef = useRef(`sess_${Date.now()}`);
  const nameCapturedRef = useRef(false);
  const transcriptRef = useRef(null);

  const conversation = useConversation({
    onConnect: () => console.log('[v0] agent connected'),
    onDisconnect: () => console.log('[v0] agent disconnected'),
    onError: (msg, ctx) => {
      console.log('[v0] agent error:', msg, ctx);
      setError(typeof msg === 'string' ? msg : 'Something went wrong.');
    },
    onMessage: (payload) => {
      // payload: { message, source: 'user' | 'ai', role }
      const text = payload?.message;
      if (!text) return;
      const role = payload?.source === 'user' ? 'user' : 'assistant';

      setTranscript((prev) => [...prev, { role, text, id: Date.now() + Math.random() }]);

      // Persist to the local store (the seam that later syncs to the cloud).
      appendMessage(
        loadSessions(),
        sessionIdRef.current,
        { persona: personaKey, topic: 'session' },
        { role, content: text }
      );

      // Capture the user's name from their first message, once.
      if (role === 'user' && !nameCapturedRef.current) {
        const name = extractName(text);
        if (name) {
          nameCapturedRef.current = true;
          saveUserData({ ...loadUserData(), name });
        }
      }
    },
  });

  const { status, isSpeaking } = conversation;
  const connected = status === 'connected';

  // Derive the orb state from the hook.
  const orbState = useMemo(() => {
    if (isSpeaking) return 'speaking';
    if (connected) return 'listening';
    return 'idle';
  }, [isSpeaking, connected]);

  // Auto-scroll the transcript as new bubbles arrive.
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  const startCall = useCallback(async () => {
    if (connected || starting) return;
    setError(null);
    setStarting(true);

    // Browsers require a user gesture + mic permission before audio capture.
    // mediaDevices is only present in a secure context (https/localhost) and,
    // inside an iframe, only when the frame is granted `allow="microphone"`.
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStarting(false);
      setError(
        window.self !== window.top
          ? 'Microphone is blocked in this preview frame. Open the app in its own tab, then tap to start.'
          : 'Your browser is blocking the microphone here. Make sure you are on a secure (https) connection and try again.'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Release this probe stream; the SDK acquires its own on startSession.
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      setStarting(false);
      const name = err?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setError(
          'Microphone access was blocked. Tap the mic/lock icon in your browser\'s address bar, allow the microphone, then tap to start again.'
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('I couldn\'t find a microphone. Connect one and tap to start again.');
      } else if (name === 'NotReadableError') {
        setError('Your microphone is in use by another app. Close it and tap to start again.');
      } else {
        setError('I need microphone access to talk with you. Enable it and tap again.');
      }
      return;
    }

    try {
      const res = await fetch('/api/conversation-token', { method: 'POST' });
      if (!res.ok) throw new Error('token request failed');
      const { token } = await res.json();
      if (!token) throw new Error('no token returned');

      const overrides = buildOverrides(personaKey, null, ANON_MAX_SECONDS);
      await conversation.startSession({
        conversationToken: token,
        connectionType: 'webrtc',
        overrides,
      });
    } catch (err) {
      console.log('[v0] failed to start session:', err);
      setError("I couldn't start the conversation. Tap to try again.");
    } finally {
      setStarting(false);
    }
  }, [connected, starting, conversation, personaKey]);

  const endCall = useCallback(() => {
    try {
      conversation.endSession();
    } catch (_) {}
  }, [conversation]);

  // Tap the orb: start when idle, end when connected.
  const onOrbTap = useCallback(() => {
    if (connected) endCall();
    else startCall();
  }, [connected, endCall, startCall]);

  // Make sure we persist sessions and tear down the call on unmount.
  useEffect(() => {
    return () => {
      try {
        saveSessions(loadSessions());
        conversation.endSession();
      } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusLine = starting
    ? 'Connecting…'
    : orbState === 'speaking'
    ? 'Speaking…'
    : orbState === 'listening'
    ? 'Listening…'
    : 'Tap to start';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: 'var(--black)', position: 'relative' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={onBack}
          style={{ padding: '5px 10px', borderRadius: 20, background: 'var(--s2)', border: '0.5px solid var(--border)', fontSize: 12, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}
          aria-label="Back"
        >
          ‹ Back
        </button>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', color: 'var(--gold)', textTransform: 'uppercase' }}>
          {persona.label}
        </div>
        {connected ? (
          <button
            onClick={endCall}
            style={{ padding: '5px 10px', borderRadius: 20, background: 'var(--s2)', border: '0.5px solid var(--border)', fontSize: 11, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}
            aria-label="End session"
          >
            End
          </button>
        ) : (
          <div style={{ width: 44 }} />
        )}
      </div>

      {/* Transcript */}
      <div
        ref={transcriptRef}
        style={{ flex: 1, overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 280 }}
      >
        {transcript.length === 0 && !connected && (
          <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--dim)', fontSize: 13, maxWidth: 260, lineHeight: 1.5 }}>
            Tap the orb below to begin your conversation with {persona.label}.
          </div>
        )}
        {transcript.map((msg) => (
          <div key={msg.id} style={{ display: 'flex', gap: 9, alignItems: 'flex-end', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', animation: 'pop 0.28s ease' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: msg.role === 'user' ? 'var(--gold)' : 'var(--s3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0, color: msg.role === 'user' ? '#000' : 'var(--gold)', fontWeight: 700 }}>
              {msg.role === 'user' ? 'U' : persona.label[0]}
            </div>
            <div className={`bub ${msg.role === 'user' ? 'user' : 'ai'}`}>{msg.text}</div>
          </div>
        ))}
      </div>

      {/* Voice stage */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 20px 28px', gap: 12 }}>
        {error && (
          <div style={{ fontSize: 12, color: 'var(--gold)', textAlign: 'center', maxWidth: 280, lineHeight: 1.4 }}>
            {error}
          </div>
        )}
        <Orb state={orbState} onClick={onOrbTap} />
        <div style={{ fontSize: 13, color: 'var(--muted)', letterSpacing: '0.3px' }}>{statusLine}</div>
      </div>
    </div>
  );
}

export default function AgentSession({ personaKey, onBack }) {
  // useConversation must live inside a ConversationProvider.
  return (
    <ConversationProvider>
      <SessionInner personaKey={personaKey} onBack={onBack} />
    </ConversationProvider>
  );
}
