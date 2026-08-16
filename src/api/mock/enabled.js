/**
 * VITE_DATA_BACKEND=mock|supabase
 * Fallback: VITE_USE_MOCK=true → mock; si hay URL+anon key → supabase; si no → mock.
 */
export function getDataBackend() {
  const explicit = import.meta.env.VITE_DATA_BACKEND;
  if (explicit === "mock" || explicit === "supabase") return explicit;
  if (import.meta.env.VITE_USE_MOCK === "true") return "mock";
  if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return "supabase";
  }
  return "mock";
}

export const isMockMode = getDataBackend() === "mock";
export const isSupabaseMode = getDataBackend() === "supabase";
