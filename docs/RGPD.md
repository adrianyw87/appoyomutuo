# Checklist RGPD / endurecimiento

- [x] Aviso de privacidad en `/privacidad`
- [x] RLS en tablas públicas (migración SQL)
- [x] Solo `anon` key en el frontend
- [x] Sin dependencia runtime de Base44
- [ ] Contacto de privacidad formal (email del proyecto)
- [ ] Flujo “borrar mi cuenta” (Edge Function + UI)
- [ ] Región EU confirmada en el proyecto Supabase
- [ ] Backup periódico (export SQL o plan con snapshots)
- [ ] Revisar políticas Storage tras primeras subidas reales
- [ ] Rate limit / captcha en Auth si hay abuso
