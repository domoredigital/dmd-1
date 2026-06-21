import { createClient } from '@supabase/supabase-js';

// Public, browser-safe credentials. NEVER reference the service_role key here.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Auth is an optional "save your progress" upgrade — the app must stay fully
// usable without it. If the env vars are missing we export `null` and the UI
// quietly hides the sign-in entry points instead of crashing.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // completes the magic-link callback automatically
      },
    })
  : null;
