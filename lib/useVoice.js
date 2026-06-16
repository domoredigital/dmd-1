import { useRef, useState, useCallback } from 'react';

export function useVoice({ voiceId, onTranscript }) {
  const [orbState, setOrbState] = useState('idle'); // idle | listening | speaking
  const [hint, setHint] = useState('Tap to speak');
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);
  const listeningRef = useRef(false);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
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

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setOrbState('idle');
        setHint('Tap to respond');
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setOrbState('idle');
        setHint('Tap to speak');
        audioRef.current = null;
      };

      await audio.play();
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
    // Tap while AI is speaking — interrupt it
    if (audioRef.current) {
      stopAudio();
      setOrbState('idle');
      setHint('Tap to speak');
      return;
    }

    if (listeningRef.current) {
      stopListening();
      return;
    }

    // Start listening
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
