import { useRef, useState, useCallback } from 'react';

export function useVoice({ voiceId, onTranscript }) {
  const [orbState, setOrbState] = useState('idle');
  const [hint, setHint] = useState('Tap to speak');
  const recognitionRef = useRef(null);
  const audioSourceRef = useRef(null);
  const audioCtxRef = useRef(null);
  const listeningRef = useRef(false);

  const stopAudio = useCallback(() => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch (_) {}
      audioSourceRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch (_) {}
      audioCtxRef.current = null;
    }
  }, []);

  const speak = useCallback(async (text) => {
    stopAudio();
    setOrbState('speaking');
    setHint('Speaking…');

    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!res.ok) throw new Error(`speak API ${res.status}`);

      // Use AudioContext for reliable cross-device playback
      const arrayBuffer = await res.arrayBuffer();
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      const source = audioCtx.createBufferSource();
      source.buffer = decoded;
      source.connect(audioCtx.destination);
      audioSourceRef.current = source;

      return new Promise((resolve) => {
        source.onended = () => {
          setOrbState('idle');
          setHint('Tap to respond');
          audioSourceRef.current = null;
          try { audioCtx.close(); } catch (_) {}
          audioCtxRef.current = null;
          resolve();
        };
        source.start(0);
      });
    } catch (err) {
      console.error('TTS error:', err);
      setOrbState('idle');
      setHint('Tap to speak');
    }
  }, [voiceId, stopAudio]);

  const initRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;

    const r = new SR();
    r.continuous = false;
    r.interimResults = true;
    r.lang = 'en-US';

    r.onstart = () => {
      listeningRef.current = true;
      setOrbState('listening');
      setHint('Listening…');
    };

    r.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join('');

      if (e.results[e.results.length - 1].isFinal) {
        stopListening();
        if (transcript.trim()) onTranscript(transcript.trim());
      } else {
        setHint(transcript.slice(-50) || 'Listening…');
      }
    };

    r.onerror = () => stopListening();
    r.onend = () => { if (listeningRef.current) stopListening(); };
    return r;
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    setOrbState('idle');
    setHint('Tap to speak');
  }, []);

  const toggleListen = useCallback(() => {
    // Tap while AI speaking — interrupt
    if (audioSourceRef.current) {
      stopAudio();
      setOrbState('idle');
      setHint('Tap to speak');
      return;
    }
    if (listeningRef.current) {
      stopListening();
      return;
    }
    if (!recognitionRef.current) {
      recognitionRef.current = initRecognition();
    }
    if (!recognitionRef.current) {
      setHint('Type your answer below');
      return;
    }
    try {
      recognitionRef.current.start();
      listeningRef.current = true;
    } catch (_) {}
  }, [stopAudio, stopListening, initRecognition]);

  return { orbState, hint, speak, toggleListen, stopAudio };
}
