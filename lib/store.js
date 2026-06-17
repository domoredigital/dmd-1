// lib/store.js
// Anonymous local persistence for conversations, profile, and insights.
// This is the single seam that auth will later sync to the cloud (Supabase) —
// nothing else in the app needs to know where data lives.

const K_SESSIONS = 'dmq_sessions';
const K_USER     = 'dmq_userData';
const K_INSIGHTS = 'dmq_insights';

function read(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try { const v = window.localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch (_) { return fallback; }
}
function write(key, val) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
}

export function loadUserData() { return read(K_USER, {}); }
export function saveUserData(d) { write(K_USER, d || {}); }

export function loadSessions() { return read(K_SESSIONS, []); }
export function saveSessions(s) { write(K_SESSIONS, Array.isArray(s) ? s : []); }

// Append one message to a session, creating the session if it doesn't exist yet.
// Returns the updated sessions array (also persisted).
export function appendMessage(sessions, sessionId, meta, msg) {
  const list = Array.isArray(sessions) ? sessions.map((s) => ({ ...s })) : [];
  let s = list.find((x) => x.id === sessionId);
  if (!s) {
    s = { id: sessionId, persona: meta.persona, topic: meta.topic, startedAt: Date.now(), messages: [] };
    list.push(s);
  }
  s.messages = [...(s.messages || []), msg];
  write(K_SESSIONS, list);
  return list;
}

export function allMessages(sessions) {
  return (sessions || []).flatMap((s) => s.messages || []);
}

export function countUserTurns(sessions) {
  return allMessages(sessions).filter((m) => m.role === 'user').length;
}

export function loadInsights() { return read(K_INSIGHTS, null); }
export function saveInsights(obj) { write(K_INSIGHTS, obj); }

// For sign-out / reset, and the future cloud-migration handoff.
export function clearAll() {
  [K_SESSIONS, K_USER, K_INSIGHTS].forEach((k) => {
    try { window.localStorage.removeItem(k); } catch (_) {}
  });
}
