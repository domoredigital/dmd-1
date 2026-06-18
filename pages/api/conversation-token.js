// ─────────────────────────────────────────────
// POST /api/conversation-token
// Requests a WebRTC conversation token from ElevenLabs
// for our Conversational AI agent.
// Keeps the API key server-side only.
// ─────────────────────────────────────────────

const AGENT_ID = 'agent_3601kvct8d99e44vh7y60kt77ea1';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    console.error('ELEVENLABS_API_KEY is not set');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  try {
    const elResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${AGENT_ID}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
      }
    );

    if (!elResponse.ok) {
      const errText = await elResponse.text();
      console.error('ElevenLabs token error:', elResponse.status, errText);
      return res.status(502).json({ error: 'Could not start conversation' });
    }

    const data = await elResponse.json();
    return res.status(200).json({ token: data.token });
  } catch (err) {
    console.error('conversation-token API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
