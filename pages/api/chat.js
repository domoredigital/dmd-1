// ─────────────────────────────────────────────
// POST /api/chat
// Proxies messages → Anthropic Claude API
// Returns { reply, suggestions } so the UI can show one-tap replies.
// Keeps API key server-side only
// ─────────────────────────────────────────────
import { PERSONAS } from '../../lib/voices';

// Shared rules that make every reply feel like a real spoken conversation.
function conversationRules(name) {
  return `

You are speaking OUT LOUD in a voice conversation. Follow these rules every time:
- Keep "reply" to 1–3 short sentences. This is spoken, not written. No lists, no markdown, no bullet points.
${name
    ? `- The user's name is ${name}. Use it naturally once or twice across the conversation — the way a real mentor or friend would, landing it on emotional beats. NOT in every message, and never robotically.`
    : `- You don't know the user's name yet. Don't ask for it again; just speak naturally.`}
- Mirror one real word or feeling the user just used, so they feel heard before you respond.
- ALWAYS end "reply" with ONE question that goes a layer deeper than what they just said. Make them feel like no one has ever asked them that before.
- Vary how you open. Never start two replies the same way.
- Never sound like an assistant or chatbot. No "How can I help you", no "As an AI". You are a person with a point of view who is genuinely curious about them.

OUTPUT FORMAT — respond with ONLY a raw JSON object, no markdown, no code fences, no text before or after:
{
  "reply": "your spoken reply ending in a question",
  "suggestions": ["short answer 1", "short answer 2"]
}
The two "suggestions" are things the USER might say back to your question — written in the user's first-person voice (e.g. "I'm not sure", "Honestly, fear"). Keep each under 5 words. They are quick taps for when the user doesn't feel like talking, so make them feel natural and a little different from each other.`;
}

// Pull the JSON object out of the model's text, tolerating stray fences/whitespace.
function parseModelOutput(text) {
  let t = (text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  try {
    const obj = JSON.parse(t);
    const reply = typeof obj.reply === 'string' ? obj.reply.trim() : '';
    const suggestions = Array.isArray(obj.suggestions)
      ? obj.suggestions.filter((s) => typeof s === 'string' && s.trim()).slice(0, 2)
      : [];
    if (reply) return { reply, suggestions };
  } catch (_) {
    // Fall through — model didn't return clean JSON this time.
  }
  // Fallback: treat whatever came back as the spoken reply, no chips.
  return { reply: (text || "I'm here with you. Tell me more.").trim(), suggestions: [] };
}

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

  const name = userData?.name;

  const systemPrompt =
    (PERSONAS[persona] || PERSONAS['The Mentor']) +
    (name ? ` The user's name is ${name}.` : '') +
    (userData?.focus ? ` Their stated focus area: ${userData.focus}.` : '') +
    (userData?.strength ? ` A strength they identified: ${userData.strength}.` : '') +
    (topic ? ` Current session topic: ${topic}.` : '') +
    conversationRules(name);

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
        max_tokens: 250,            // reply + two short suggestions
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
    const raw = data.content?.[0]?.text || '';
    const { reply, suggestions } = parseModelOutput(raw);
    return res.status(200).json({ reply, suggestions });
  } catch (err) {
    console.error('chat API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
