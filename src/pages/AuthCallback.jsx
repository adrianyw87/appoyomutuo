import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSupabase } from "@/api/supabase/browser";
import { isMockMode } from "@/api/mock/enabled";

/** Completa OAuth / magic link de Supabase y redirige a returnTo. */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    if (isMockMode) {
      navigate("/", { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const sb = getSupabase();
        // Exchange code if present (PKCE) or rely on detectSessionInUrl
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          const { error: exchangeError } = await sb.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else {
          const { data, error: sessionError } = await sb.auth.getSession();
          if (sessionError) throw sessionError;
          if (!data.session) {
            throw new Error("No se pudo completar el inicio de sesión");
          }
        }

        let returnTo = "/";
        try {
          returnTo = sessionStorage.getItem("am_return_to") || "/";
          sessionStorage.removeItem("am_return_to");
        } catch {
          /* ignore */
        }
        if (cancelled) return;
        navigate(returnTo.startsWith("/") ? returnTo : "/", { replace: true });
      } catch (err) {
        if (!cancelled) setError(err.message || "Error de autenticación");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-destructive text-sm">{error}</p>
        <a href="/login" className="text-primary underline text-sm">
          Volver al login
        </a>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );
}
