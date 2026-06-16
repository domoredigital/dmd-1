# DO MORE: Questions

> Better questions. Better life.

A voice-first AI self-discovery app powered by Claude (Anthropic) + ElevenLabs ultra-realistic voices.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (Pages Router) |
| AI — chat | Anthropic Claude Sonnet (via `/api/chat`) |
| AI — voice | ElevenLabs Turbo v2.5 (via `/api/speak`) |
| Rate limiting | Upstash Redis (optional) |
| Deployment | Vercel (recommended) or Railway |

---

## Local Setup

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/do-more-questions.git
cd do-more-questions
npm install
```

### 2. Set environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
ELEVENLABS_API_KEY=sk_...       # from elevenlabs.io/profile
ANTHROPIC_API_KEY=sk-ant-...    # from console.anthropic.com
# Optional — for rate limiting:
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel (recommended — free tier works)

```bash
npm install -g vercel
vercel
```

Then in your Vercel dashboard → Project → Settings → Environment Variables, add:
- `ELEVENLABS_API_KEY`
- `ANTHROPIC_API_KEY`
- (optional) `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`

Redeploy after adding env vars.

---

## Deploy to Railway

1. Push to GitHub
2. Create new Railway project → Deploy from GitHub repo
3. Add env vars in Railway dashboard
4. Railway auto-detects Next.js and deploys

---

## Project Structure

```
do-more-questions/
├── pages/
│   ├── _app.jsx              # Global CSS import
│   ├── index.jsx             # Main app shell + screen routing
│   └── api/
│       ├── speak.js          # ElevenLabs TTS proxy (key stays server-side)
│       └── chat.js           # Anthropic Claude proxy (key stays server-side)
├── components/
│   ├── Logo.jsx              # Logo D component
│   ├── Orb.jsx               # Voice orb button
│   ├── BottomNav.jsx         # Navigation bar
│   └── screens/
│       ├── VoicePicker.jsx   # Voice selection screen
│       ├── Session.jsx       # Onboarding + voice chat screen
│       ├── Home.jsx          # Home screen
│       ├── Insights.jsx      # Insights & patterns screen
│       └── Leverage.jsx      # Action recommendations screen
├── lib/
│   ├── voices.js             # Voice IDs, persona prompts, EL settings
│   ├── onboard.js            # Onboarding questions, daily prompts
│   └── useVoice.js           # Speech recognition + TTS hook
├── styles/
│   └── globals.css           # All styles + CSS variables
├── .env.example              # Environment variable template
├── next.config.js
└── package.json
```

---

## API Routes

### `POST /api/speak`
Converts text to ElevenLabs audio. EL API key never exposed to client.

**Body:** `{ text: string, voiceId: string }`  
**Returns:** `audio/mpeg` stream

### `POST /api/chat`
Gets AI response from Claude. Anthropic API key never exposed to client.

**Body:** `{ messages: array, persona: string, userData: object, topic: string }`  
**Returns:** `{ reply: string }`

---

## Voices

| Name | Persona | Energy |
|---|---|---|
| Marcus | The Mentor | Deep & grounded |
| Aria | The Coach | Warm & clear |
| Elias | Therapist Guide | Calm & thoughtful |
| Zara | The Challenger | Bold & direct |
| Sofia | Sofia Mode | Smooth & magnetic |

To swap voices, update `voiceId` values in `lib/voices.js`.

---

## Rate Limiting (optional)

Uses Upstash Redis + `@upstash/ratelimit`. Free tier at [upstash.com](https://upstash.com) handles ~500 req/day easily.

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in your env vars. If not set, rate limiting is skipped automatically.

---

## Roadmap

- [ ] Supabase auth + user accounts
- [ ] Persistent conversation history per user
- [ ] Insight generation from conversation analysis
- [ ] Push notifications
- [ ] React Native mobile app (iOS + Android)
- [ ] ElevenLabs streaming for lower latency
- [ ] Premium tier (Stripe integration)
