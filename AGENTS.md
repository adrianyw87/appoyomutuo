# AGENTS.md

## Project Context

Appoyo Mutuo — app social de proyectos colectivos. Frontend React/Vite; backend **Supabase** (Auth, Postgres, Realtime, Storage). Despliegue previsto en Cloudflare Pages.

Start with `README.md` and `docs/DEPLOY.md`.

## Key Files

- `src/`: frontend
- `src/api/base44Client.js`: cliente unificado (`mock` | `supabase`); el nombre es histórico
- `src/api/supabase/`: adaptador Supabase
- `src/api/mock/`: datos y cliente mock local
- `supabase/migrations/`: schema + RLS
- `supabase/functions/geocode-location/`: geocoding Nominatim
- `.env.local`: nunca commitear secretos

## Working Notes

- Desarrollo por defecto: `VITE_DATA_BACKEND=mock` + `npm run dev`
- Staging/prod: `VITE_DATA_BACKEND=supabase` + URL/anon key
- No reintroducir `@base44/sdk` ni el plugin Vite de Base44
- Mantener la API de entidades (`list` / `filter` / `create` / …) para no romper páginas
- Ejecutar checks de `package.json` antes de dar por cerrados cambios de código
