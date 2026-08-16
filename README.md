# Appoyo Mutuo

Plataforma social para lanzar proyectos colectivos y unirse a iniciativas de apoyo mutuo.

Stack: **React + Vite** (frontend), **Supabase** (Auth, Postgres, Realtime, Storage), despliegue en **Cloudflare Pages**.

## Desarrollo local (mock, sin cuenta)

```bash
npm install
cp .env.example .env.local   # deja VITE_DATA_BACKEND=mock
npm run dev
```

Datos de ejemplo en `src/api/mock/data/`. Login local: botón Entrar → sesión mock (Ada Demo).

## Conectar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (región EU si puedes).
2. En SQL Editor, ejecuta el contenido de [`supabase/migrations/20260805000000_init.sql`](supabase/migrations/20260805000000_init.sql).
3. Auth → Providers → activa **Google** (Client ID/Secret de Google Cloud).
4. Auth → URL configuration:
   - Site URL: `http://localhost:5173` (luego tu dominio)
   - Redirect URLs: `http://localhost:5173/auth/callback`, `https://TU_DOMINIO/auth/callback`, `https://TU_DOMINIO/reset-password`
5. (Opcional) Despliega geocode: `supabase functions deploy geocode-location`
6. `.env.local`:

```bash
VITE_DATA_BACKEND=supabase
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

7. `npm run dev`

Guía detallada: [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run dev` | Desarrollo |
| `npm run build` | Build producción |
| `npm run preview` | Previsualizar build |
| `npm run lint` | ESLint |

## Privacidad

Aviso básico en `/privacidad`.
