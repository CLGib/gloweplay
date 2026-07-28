/* ────────────────────────────────────────────────────────────
   Glowe Play — Supabase configuration

   Paste your project's PUBLIC values below. Find them in Supabase:
     Project Settings → API
       • Project URL   → url
       • anon / public → anonKey   (the key labeled "anon" "public")

   These two values are SAFE to expose in client-side code and to
   commit. The anon key is designed to be public and is protected by
   Row Level Security. NEVER put the "service_role" secret key here.
   ──────────────────────────────────────────────────────────── */
window.GLOWE_SUPABASE = {
  url: "YOUR_SUPABASE_PROJECT_URL",   // e.g. https://abcdefgh.supabase.co
  anonKey: "YOUR_SUPABASE_ANON_KEY"   // the anon / public key
};
