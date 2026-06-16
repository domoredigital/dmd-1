// ─────────────────────────────────────────────
// POST /api/speak
// Proxies text → ElevenLabs TTS audio stream
// Keeps API key server-side only
// ─────────────────────────────────────────────

import { VOICE_SETTINGS } from '../../lib/voices';

// Optional: rate limiting via Upstash Redis
// Remove this block if you don't want rate limiting yet
let ratelimit = null;
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  const { Ratelimit } = require('@upstash/ratelimit');
  const { Redis } = require('@upstash/redis');
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(15, '1 m'), // 15 requests per minute per IP
    analytics: true,
  });
}

export const config = {
  api: {
    responseLimit: false, // allow streaming large audio files
  },
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting check
  if (ratelimit) {
    const ip = req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? 'unknown';
    const { success, remaining } = await ratelimit.limit(ip);
    res.setHeader('X-RateLimit-Remaining', remaining);
    if (!success) {
      return res.status(429).json({ error: 'Too many requests. Please slow down.' });
    }
  }

  const { text, voiceId } = req.body;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }
  if (!voiceId || typeof voiceId !== 'string') {
    return res.status(400).json({ error: 'voiceId is required' });
  }

  // Sanitize text — strip markdown formatting before sending to EL
  const cleanText = text
    .replace(/\*+/g, '')
    .replace(/[#_~`]/g, '')
    .trim()
    .slice(0, 2500); // EL free tier limit

  if (!cleanText) {
    return res.status(400).json({ error: 'text is empty after sanitization' });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    console.error('ELEVENLABS_API_KEY is not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const elResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: VOICE_SETTINGS.model_id,
          voice_settings: VOICE_SETTINGS.voice_settings,
        }),
      }
    );

    if (!elResponse.ok) {
      const errText = await elResponse.text();
      console.error('ElevenLabs error:', elResponse.status, errText);
      return res.status(502).json({
        error: 'Voice generation failed',
        status: elResponse.status,
      });
    }

    // Stream audio directly back to client
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Transfer-Encoding', 'chunked');

    const reader = elResponse.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (err) {
    console.error('speak API error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
