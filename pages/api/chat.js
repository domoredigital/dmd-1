// ─────────────────────────────────────────────
// POST /api/chat
// Proxies messages → Anthropic Claude API
// Keeps API key server-side only
// ─────────────────────────────────────────────

import { PERSONAS } from '../../lib/voices';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, persona, userData, topic } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const systemPrompt =
    (PERSONAS[persona] || PERSONAS['The Mentor']) +
    (userData?.name ? ` The user's name is ${userData.name}.` : '') +
    (userData?.focus ? ` Their stated focus area: ${userData.focus}.` : '') +
    (userData?.strength ? ` A strength they identified: ${userData.strength}.` : '') +
    (topic ? ` Current session topic: ${topic}.` : '');

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages.slice(-10), // keep last 10 turns for context
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      console.error('Anthropic error:', anthropicRes.status, errText);
      return res.status(502).json({ error: 'AI response failed' });
    }

    const data = await anthropicRes.json();
    const reply = data.content?.[0]?.text || "I'm here with you. Tell me more.";

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('chat API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
