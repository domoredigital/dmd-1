import { useRef, useState, useCallback } from 'react';

export function useVoice({ voiceId, onTranscript }) {
  const [orbState, setOrbState] = useState('idle');
  const [hint, setHint] = useState('Tap to speak');

  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);

  // Playback refs — we may use either MediaSource (fast path) or AudioContext (fallback)
  const audioElRef = useRef(null);
  const audioSourceRef = useRef(null);
  const audioCtxRef = useRef(null);
  const stoppedRef = useRef(false);

  // End-of-speech detection
  const silenceTimer = useRef(null);
  const finalTextRef = useRef('');
  const lastSpeechAt = useRef(0);

  const SILENCE_MS = 650; // 650ms feels human. The old code waited far longer.

  // ---------------------------------------------------------------------------
  // PLAYBACK
  // ---------------------------------------------------------------------------
  const stopAudio = useCallback(() => {
    stoppedRef.current = true;
    if (audioElRef.current) {
      try { audioElRef.current.pause(); } catch (_) {}
      audioElRef.current = null;
    }
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
    stoppedRef.current = false;
    setOrbState('speaking');
    setHint('Speaking…');

    const finish = () => {
      setOrbState('idle');
      setHint('Tap to respond');
      audioElRef.current = null;
      audioSourceRef.current = null;
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (_) {}
        audioCtxRef.current = null;
      }
    };

    try {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
      });
      if (!res.ok || !res.body) throw new Error(`speak API ${res.status}`);

      const MIME = 'audio/mpeg';
      const canStream =
        typeof window !== 'undefined' &&
        'MediaSource' in window &&
        window.MediaSource.isTypeSupported &&
        window.MediaSource.isTypeSupported(MIME);

      // ---- FAST PATH: MediaSource — audio starts on the first chunk ----
      if (canStream) {
        const audio = new Audio();
        audio.preload = 'auto';
        audioElRef.current = audio;

        const mediaSource = new MediaSource();
        audio.src = URL.createObjectURL(mediaSource);

        return await new Promise((resolve) => {
          let resolved = false;
          const done = () => { if (!resolved) { resolved = true; finish(); resolve(); } };

          audio.addEventListener('ended', done);

          mediaSource.addEventListener('sourceopen', async () => {
            let sb;
            try { sb = mediaSource.addSourceBuffer(MIME); }
            catch (_) { done(); return; }

            const reader = res.body.getReader();
            const queue = [];
            let started = false;

            const pump = () => {
              if (stoppedRef.current) return;
              if (queue.length && !sb.updating) {
                try { sb.appendBuffer(queue.shift()); } catch (_) {}
              }
            };
            sb.addEventListener('updateend', pump);

            try {
              while (true) {
                const { done: rdone, value } = await reader.read();
                if (rdone || stoppedRef.current) break;
                if (value) {
                  queue.push(value);
                  pump();
                  if (!started) {
                    started = true;
                    audio.play().catch(() => {});
                  }
                }
              }
            } catch (_) { /* stream aborted */ }

            const end = () => {
              if (mediaSource.readyState === 'open') {
                try { mediaSource.endOfStream(); } catch (_) {}
              }
            };
            if (queue.length || sb.updating) {
              const iv = setInterval(() => {
                if (stoppedRef.current) { clearInterval(iv); return; }
                if (!queue.length && !sb.updating) { clearInterval(iv); end(); }
              }, 30);
            } else end();
          });
        });
      }

      // ---- FALLBACK: AudioContext (iOS Safari etc.) — buffer then play ----
      const arrayBuffer = await res.arrayBuffer();
      if (stoppedRef.current) { finish(); return; }
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      const source = audioCtx.createBufferSource();
      source.buffer = decoded;
      source.connect(audioCtx.destination);
      audioSourceRef.current = source;

      return await new Promise((resolve) => {
        source.onended = () => { finish(); resolve(); };
        source.start(0);
      });
    } catch (err) {
      console.error('TTS error:', err);
      setOrbState('idle');
      setHint('Tap to speak');
    }
  }, [voiceId, stopAudio]);

  // ---------------------------------------------------------------------------
  // SPEECH RECOGNITION
  // ---------------------------------------------------------------------------
  const clearSilence = () => {
    if (silenceTimer.current) { clearTimeout(silenceTimer.current); silenceTimer.current = null; }
  };

  const commit = useCallback(() => {
    clearSilence();
    const text = finalTextRef.current.trim();
    finalTextRef.current = '';
    listeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    setOrbState('idle');
    if (text) {
      setHint('Thinking…');
      onTranscript(text);
    } else {
      setHint('Tap to speak');
    }
  }, [onTranscript]);

  const armSilence = useCallback(() => {
    clearSilence();
    silenceTimer.current = setTimeout(() => {
      if (Date.now() - lastSpeechAt.current >= SILENCE_MS) commit();
      else armSilence();
    }, SILENCE_MS);
  }, [commit]);

  const initRecognition = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    const r = new SR();
    r.continuous = true;      // we decide when to stop, not the browser
    r.interimResults = true;
    r.lang = 'en-US';

    r.onstart = () => {
      listeningRef.current = true;
      finalTextRef.current = '';
      lastSpeechAt.current = Date.now();
      setOrbState('listening');
      setHint('Listening…');
    };

    r.onresult = (e) => {
      lastSpeechAt.current = Date.now();
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i];
        if (chunk.isFinal) finalTextRef.current += chunk[0].transcript + ' ';
        else interim += chunk[0].transcript;
      }
      const live = (finalTextRef.current + interim).trim();
      setHint(live.slice(-50) || 'Listening…');
      armSilence(); // reset the clock on every word
    };

    // Browser's native end-of-speech cue — fastest possible signal.
    r.onspeechend = () => {
      setTimeout(() => {
        if (listeningRef.current && Date.now() - lastSpeechAt.current >= 300) commit();
      }, 300); // tiny hangover so a mid-sentence breath doesn't cut you off
    };

    r.onerror = (ev) => {
      if (ev.error === 'no-speech' || ev.error === 'aborted') {
        listeningRef.current = false;
        setOrbState('idle');
        setHint('Tap to speak');
        return;
      }
      commit();
    };

    r.onend = () => {
      if (listeningRef.current && finalTextRef.current.trim()) commit();
      else { listeningRef.current = false; }
    };

    return r;
  }, [armSilence, commit]);

  const stopListening = useCallback(() => {
    clearSilence();
    const text = finalTextRef.current.trim();
    finalTextRef.current = '';
    listeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    setOrbState('idle');
    if (text) { setHint('Thinking…'); onTranscript(text); }
    else setHint('Tap to speak');
  }, [onTranscript]);

  const toggleListen = useCallback(() => {
    // Tap while the AI is speaking — interrupt (barge-in)
    if (audioElRef.current || audioSourceRef.current) {
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
