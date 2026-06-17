// ─────────────────────────────────────────────
// POST /api/insights
// Analyzes the user's conversation transcript and returns a structured
// profile that powers BOTH the Insights tab and the Leverage tab.
// One call, cached client-side, so we never analyze twice.
// ─────────────────────────────────────────────

const SYSTEM = `You are the insight engine for a self-discovery app called "DO MORE: Questions".
You read a transcript of someone's spoken conversations with an AI guide and reflect back what you notice about them — like a perceptive coach handing them a mirror.

Rules:
- Base EVERYTHING on what the user actually said. Do not invent specifics they never mentioned.
- If the conversation is thin, infer gently and keep claims modest — never fabricate detail.
- Keep every phrase short, concrete, and human. No therapy clichés.
- "values" numbers are 0–100 estimates of how strongly each value showed up.
- Make "actions" specific and clearly tied to something they said. Each "note" explains why it fits THEM.
- "recs" can include a book, podcast, or course that genuinely matches their themes.

Respond with ONLY a raw JSON object — no markdown, no code fences, no text before or after:
{
  "strengths": ["3 to 5 short strength phrases"],
  "growth": ["2 to 3 short growth-edge phrases"],
  "values": [["Freedom", 88], ["Impact", 80]],
  "themes": [{"emoji": "🚀", "name": "short theme", "note": "where it showed up"}],
  "actions": [{"text": "one specific next action", "note": "why it fits them"}],
  "challenges": [{"name": "challenge name", "meta": "7 days · short descriptor"}],
  "recs": [{"emoji": "📖", "title": "specific title", "type": "Book · why it matches"}]
}`;

function parseJSON(text) {
  let t = (text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(t); } catch (_) { return null; }
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, userData } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const transcript = messages
    .map((m) => `${m.role === 'assistant' ? 'Guide' : 'User'}: ${m.content}`)
    .join('\n');

  const profileLine = [
    userData?.name ? `Name: ${userData.name}` : '',
    userData?.focus ? `Stated focus: ${userData.focus}` : '',
    userData?.strength ? `Self-identified strength: ${userData.strength}` : '',
  ].filter(Boolean).join('. ');

  const userContent =
    (profileLine ? `${profileLine}.\n\n` : '') +
    `Transcript of their conversations:\n${transcript}`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 900,
        system: SYSTEM,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error('Anthropic error:', r.status, errText);
      return res.status(502).json({ error: 'Analysis failed' });
    }

    const data = await r.json();
    const parsed = parseJSON(data.content?.[0]?.text);
    if (!parsed) return res.status(502).json({ error: 'Could not parse analysis' });

    // Normalize so the UI never crashes on a missing field.
    const insights = {
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
      growth: Array.isArray(parsed.growth) ? parsed.growth.slice(0, 3) : [],
      values: Array.isArray(parsed.values) ? parsed.values.slice(0, 5) : [],
      themes: Array.isArray(parsed.themes) ? parsed.themes.slice(0, 3) : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 3) : [],
      challenges: Array.isArray(parsed.challenges) ? parsed.challenges.slice(0, 3) : [],
      recs: Array.isArray(parsed.recs) ? parsed.recs.slice(0, 3) : [],
    };

    return res.status(200).json({ insights });
  } catch (err) {
    console.error('insights API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
