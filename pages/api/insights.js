// ─────────────────────────────────────────────
// POST /api/insights
// Analyzes the user's conversation transcript and returns a structured
// profile that powers BOTH the Insights tab and the Leverage tab.
// One call, cached client-side, so we never analyze twice.
//
// Every observation must carry a "receipt": a short verbatim quote (or close
// paraphrase) of something the user actually said. No evidence → omit the item.
// ─────────────────────────────────────────────

const SYSTEM = `You are the insight engine for a self-discovery app called "DO MORE: Questions".
You read a transcript of someone's spoken conversations with an AI guide and reflect back what you notice — like a perceptive coach handing them a mirror.

EVIDENCE RULES (most important):
- Base EVERY observation on real evidence from the transcript.
- For every strength, value, theme, and growth area, include a "quote": a brief verbatim quote (UNDER 15 words) of something the user actually said, as the receipt for that observation. A very close paraphrase is allowed only if no single line fits.
- NEVER invent quotes or attribute words the user did not say. If there is no real evidence for an item, OMIT that item entirely rather than fabricate.
- Quotes must come from the User's lines, never the Guide's.

OTHER RULES:
- Keep every phrase short, concrete, and human. No therapy clichés.
- "values" numbers are 0–100 estimates of how strongly each value showed up.
- Make "actions" specific and clearly tied to something they said. Each "note" explains why it fits THEM.
- "recs" can include a book, podcast, or course that genuinely matches their themes.

TWO REFLECTIVE FIELDS:
- "honest_observation": ONE kind-but-real observation the user may be avoiding or not seeing, grounded in the transcript. Compassionate, never harsh. Always include it when there is enough conversation.
- "shift": ONE observation about how the user has changed ACROSS sessions (a theme that faded, a word they now use more, a softening or hardening of tone). ONLY include this if more than one session is present. If only one session exists, set "shift" to null.

Respond with ONLY a raw JSON object — no markdown, no code fences, no text before or after:
{
  "honest_observation": "one compassionate, real observation grounded in what they said",
  "shift": "how they've changed across sessions, or null if only one session",
  "strengths": [{"text": "short strength phrase", "quote": "their words (<15w)"}],
  "growth": [{"text": "short growth-edge phrase", "quote": "their words (<15w)"}],
  "values": [{"label": "Freedom", "pct": 88, "quote": "their words (<15w)"}],
  "themes": [{"emoji": "🚀", "name": "short theme", "note": "where it showed up", "quote": "their words (<15w)"}],
  "actions": [{"text": "one specific next action", "note": "why it fits them"}],
  "challenges": [{"name": "challenge name", "meta": "7 days · short descriptor"}],
  "recs": [{"emoji": "📖", "title": "specific title", "type": "Book · why it matches"}]
}`;

function parseJSON(text) {
  let t = (text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try { return JSON.parse(t); } catch (_) { return null; }
}

// Coerce a strength/growth item into { text, quote } regardless of how Claude shaped it.
function normItem(item) {
  if (typeof item === 'string') return { text: item, quote: '' };
  if (item && typeof item === 'object') {
    return { text: item.text || item.name || '', quote: item.quote || '' };
  }
  return null;
}

// Coerce a value into { label, pct, quote }, tolerating the old [label, pct] tuple form.
function normValue(v) {
  if (Array.isArray(v)) return { label: v[0] || '', pct: Number(v[1]) || 0, quote: '' };
  if (v && typeof v === 'object') {
    return { label: v.label || v.name || '', pct: Number(v.pct) || 0, quote: v.quote || '' };
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, userData, sessions } = req.body || {};
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  // Build a session-aware transcript so Claude can observe shifts across sessions.
  const sessionList = Array.isArray(sessions) ? sessions.filter((s) => (s.messages || []).length) : [];
  const sessionCount = sessionList.length;

  let transcript;
  if (sessionCount > 0) {
    transcript = sessionList
      .map((s, i) => {
        const when = s.startedAt ? new Date(s.startedAt).toLocaleDateString() : '';
        const head = `--- Session ${i + 1}${when ? ` (${when})` : ''} ---`;
        const body = (s.messages || [])
          .map((m) => `${m.role === 'assistant' ? 'Guide' : 'User'}: ${m.content}`)
          .join('\n');
        return `${head}\n${body}`;
      })
      .join('\n\n');
  } else {
    transcript = messages
      .map((m) => `${m.role === 'assistant' ? 'Guide' : 'User'}: ${m.content}`)
      .join('\n');
  }

  const profileLine = [
    userData?.name ? `Name: ${userData.name}` : '',
    userData?.focus ? `Stated focus: ${userData.focus}` : '',
    userData?.strength ? `Self-identified strength: ${userData.strength}` : '',
  ].filter(Boolean).join('. ');

  const userContent =
    (profileLine ? `${profileLine}.\n\n` : '') +
    `Number of separate sessions: ${sessionCount || 1}.\n\n` +
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
        max_tokens: 1500,
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

    // Normalize so the UI never crashes on a missing or differently-shaped field.
    const insights = {
      honest_observation: typeof parsed.honest_observation === 'string' ? parsed.honest_observation : '',
      // Only surface a shift when there's genuinely more than one session.
      shift: sessionCount > 1 && typeof parsed.shift === 'string' && parsed.shift.trim() ? parsed.shift : null,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(normItem).filter(Boolean).slice(0, 5) : [],
      growth: Array.isArray(parsed.growth) ? parsed.growth.map(normItem).filter(Boolean).slice(0, 3) : [],
      values: Array.isArray(parsed.values) ? parsed.values.map(normValue).filter(Boolean).slice(0, 5) : [],
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
