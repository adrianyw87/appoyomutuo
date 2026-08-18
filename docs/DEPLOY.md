# Despliegue Appoyo Mutuo (Supabase + Cloudflare Pages)

Presupuesto objetivo: **0–20 €/mes** (free tiers al inicio + dominio ~10 €/año).

## Migraciones SQL adicionales

Tras el schema inicial, ejecuta también (si aún no lo has hecho), en este orden:

1. [`supabase/migrations/20260811000000_project_info_pdf.sql`](../supabase/migrations/20260811000000_project_info_pdf.sql) — columna `info_pdf_url` + bucket `project-docs`.
2. [`supabase/migrations/20260812000000_seed_madrid_projects.sql`](../supabase/migrations/20260812000000_seed_madrid_projects.sql) — **38 proyectos semilla** en Madrid (pack inicial + ampliación).
3. [`supabase/migrations/20260819000000_admin_moderation.sql`](../supabase/migrations/20260819000000_admin_moderation.sql) — panel admin + aprobación de proyectos.

Puedes regenerar el SQL de semilla desde el JSON mock:

```bash
node scripts/generate-seed-sql.mjs
```

---

## Dominio: `.com` o `.org`

Ambos valen. DNS no distingue mayúsculas: `AppoyoMutuo.org` = `appoyomutuo.org`.

| | `.org` | `.com` |
|--|--------|--------|
| Sensación | Más “proyecto / asociación / sin ánimo de lucro” | Más genérico / comercial |
| Coste | Similar (~10–15 €/año) | Similar |

**Recomendación para este proyecto:** `appoyomutuo.org` si está libre.

1. Comprueba disponibilidad en [Cloudflare Registrar](https://dash.cloudflare.com/) → **Domain Registration** (o Namecheap, etc.).
2. Compra el dominio **en Cloudflare** si puedes: DNS y Pages quedan en el mismo sitio.
3. Primero despliega la app (URL `*.pages.dev`); luego enlazas el dominio custom.

Mientras no compres dominio, la web pública será algo como `https://appoyomutuo.pages.dev`.

---

## 1. Supabase (Auth en producción)

Cuando tengas la URL de Pages (o el dominio):

**Authentication → URL Configuration**

- **Site URL:** `https://TU-PROYECTO.pages.dev` (luego `https://appoyomutuo.org`)
- **Redirect URLs** (todas a la vez):
  - `http://localhost:5173/auth/callback`
  - `http://localhost:5173/reset-password`
  - `https://TU-PROYECTO.pages.dev/auth/callback`
  - `https://TU-PROYECTO.pages.dev/reset-password`
  - `https://appoyomutuo.org/auth/callback` (cuando exista)
  - `https://appoyomutuo.org/reset-password`

En **Google Cloud → Cliente OAuth**, añade origen:
- `https://TU-PROYECTO.pages.dev`
- `https://appoyomutuo.org` (cuando exista)

El redirect de Google sigue siendo:
`https://nfjdpiwytxgvnbibhodq.supabase.co/auth/v1/callback`

---

## 2. Cloudflare Pages — opción A (sin Git, rápida)

1. Cuenta en [dash.cloudflare.com](https://dash.cloudflare.com).
2. En la carpeta del proyecto:

```bash
npm run build
npx wrangler pages project create appoyomutuo
npx wrangler pages deploy dist --project-name=appoyomutuo
```

(`wrangler login` la primera vez.)

3. En el dashboard de Pages → tu proyecto → **Settings → Environment variables** (Production):

```
VITE_DATA_BACKEND=supabase
VITE_SUPABASE_URL=https://nfjdpiwytxgvnbibhodq.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

**Importante:** las variables `VITE_*` se inyectan en el **build**. Si desplegaste `dist` ya construido en local, esas vars deben estar en tu `.env.local` **antes** de `npm run build`, o vuelve a buildear tras configurarlas y redespliega.

4. Abre la URL `*.pages.dev` que te den.

## 2b. Cloudflare Pages — opción B (con GitHub, recomendada a medio plazo)

1. `git init` + repo en GitHub.
2. Cloudflare Pages → **Create** → conectar repo.
3. Build:
   - Framework: Vite
   - Build command: `npm run build`
   - Output: `dist`
   - Node: 20
4. Environment variables (Production) como arriba — Cloudflare las usa en cada build.
5. Cada push a `main` redeploy automático.

`public/_redirects` ya está para rutas SPA.

---

## 3. Enlazar `appoyomutuo.org` (o `.com`)

1. Pages → tu proyecto → **Custom domains** → Add `appoyomutuo.org` (y opcional `www`).
2. Si el dominio está en Cloudflare, la DNS se configura sola.
3. Actualiza Site URL + Redirects en Supabase y orígenes en Google.
4. Espera el SSL (minutos).

---

## 4. Checklist post-deploy

- [ ] Home / Ideas / Radar cargan
- [ ] Login Google desde la URL pública
- [ ] Crear proyecto
- [ ] `/privacidad`
- [ ] Dominio custom (si aplica)

## 5. Costes

| Servicio | Coste |
|----------|--------|
| Supabase Free | 0 € |
| Cloudflare Pages | 0 € |
| Dominio `.org` / `.com` | ~10–15 €/año |

## 6. Edge Function geocode (opcional)

```bash
npx supabase login
npx supabase link --project-ref nfjdpiwytxgvnbibhodq
npx supabase functions deploy geocode-location
```
