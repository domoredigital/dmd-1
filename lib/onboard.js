// ─────────────────────────────────────────────
// Onboarding flow — questions & daily prompts
// ─────────────────────────────────────────────

export const ONBOARD_STEPS = [
  {
    key: 'name',
    q: "Before we start — what should I call you?",
    chips: null,
  },
  {
    key: 'focus',
    q: "Love that. What's pulling at you most right now in your life?",
    chips: ['Career growth', 'Finding purpose', 'Relationships', 'Confidence', 'Money', 'Health'],
  },
  {
    key: 'feeling',
    q: "Be real with me — how do you feel about where you are right now?",
    chips: ['Stuck', 'Energized', 'Confused', 'Motivated', 'Lost', 'Ready'],
  },
  {
    key: 'dream',
    q: "What's something you've always wanted but haven't gone after yet?",
    chips: null,
  },
  {
    key: 'strength',
    q: "Last one — what's a strength you have that you seriously underestimate?",
    chips: ['Problem solving', 'Connecting people', 'Creative thinking', 'Leadership', 'Persistence', 'Empathy'],
  },
];

export const DAILY_QUESTIONS = [
  "What do you wish people understood about you?",
  "What would you attempt if failure wasn't possible?",
  "What are you tolerating that no longer serves you?",
  "What would your future self thank you for doing today?",
  "Where do you feel most like yourself?",
  "What belief is quietly limiting your potential?",
  "What are you pretending not to know?",
  "What would you do if you weren't afraid of what people thought?",
  "When did you last feel truly proud of yourself?",
  "What conversation have you been avoiding that needs to happen?",
];

export const SESSION_OPENERS = {
  'Daily Question': "Let's dig into today's question — what would you attempt if failure wasn't possible?",
  Continue: "Welcome back. What's been on your mind since we last talked?",
  Talk: "Good to have you here. What do you want to explore today?",
  Identity: "Beyond your roles and titles — who are you when no one is watching?",
  Purpose: "What makes you feel like what you're doing actually matters?",
  Career: "Not what you do — what do you want your work to mean for your life?",
  Confidence: "Where in your life do you feel least like yourself, and why do you think that is?",
  Relationships: "What's one relationship in your life that you know needs more from you?",
  Money: "When you think about money, what emotion comes up first — and where do you think that comes from?",
  Health: "If your body could speak right now, what do you think it would tell you?",
  Leadership: "Think of a moment you led without a title. What did you do, and why did you step up?",
};
