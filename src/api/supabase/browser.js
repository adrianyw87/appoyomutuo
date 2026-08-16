import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client = null;

export function getSupabase() {
  if (!url || !anonKey) {
    throw new Error(
      "Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Configúralos en .env.local"
    );
  }
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
