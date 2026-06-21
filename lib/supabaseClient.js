import { createClient } from '@supabase/supabase-js';

// Public, browser-safe credentials. NEVER reference the service_role key here.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// The URL must be a real http(s) URL (e.g. https://xxxx.supabase.co). A missing
// or malformed value (e.g. a project name pasted by mistake) would otherwise
// make createClient throw and crash the whole app, so we validate first.
function isValidHttpUrl(value) {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// Auth is an optional "save your progress" upgrade — the app must stay fully
// usable without it. If the env vars are missing or invalid we export `null`
// and the UI quietly hides the sign-in entry points instead of crashing.
export const isSupabaseConfigured =
  isValidHttpUrl(supabaseUrl) && Boolean(supabaseAnonKey);

if (supabaseUrl && !isValidHttpUrl(supabaseUrl)) {
  console.warn(
    '[v0] NEXT_PUBLIC_SUPABASE_URL is not a valid URL. Expected something like ' +
      'https://your-project.supabase.co — auth is disabled until it is fixed.'
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // completes the magic-link callback automatically
      },
    })
  : null;
