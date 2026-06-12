# Aurum Realty — Supabase Setup

Cliente actual cargado: **Unnique Negocios Inmobiliarios** (Neuquén Capital).

## Orden canónico de scripts (SQL Editor)

Para una base nueva, correr **en este orden**. Todos son idempotentes
(se pueden re-correr sin romper nada):

| # | Archivo | Qué hace |
|---|---------|----------|
| 1 | `migrations/001_initial.sql` | Esquema base, triggers, RLS inicial |
| 2 | `policies_leads.sql` | Propiedad de leads (owner/pozo/claims), RPCs, RLS real, columnas de dólar |
| 3 | `migrations/004_days_sin_contacto.sql` | `days_without_contact` derivado de actividad real (trigger + recálculo) |
| 4 | `migrations/005_equipo_admin_only.sql` | Escrituras sobre `agents` solo Admin |
| 5 | `migrations/006_seed_unnique.sql` | Datos de demo de Unnique (org, equipo, 20 propiedades, 11 leads) |
| 6 | `migrations/007_property_photos.sql` | Galería multi-foto (`property_photos`, portada cacheada en `photo_url`) |
| 7 | `storage_property_photos.sql` | Bucket `property-photos` + policies de Storage |
| 8 | `migrations/008_hardening_e_indices.sql` | Stages/org/activities-delete solo Admin + índices |

> `migrations/002_reseed.sql` es legacy (demo vieja); no correr en bases nuevas.
> Cada script termina con una query de **verificación** — revisá su output.

## Env vars (Vercel → Project Settings → Environment Variables)

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key (legacy JWT)>
SUPABASE_SERVICE_ROLE_KEY=<service role key (legacy JWT, empieza con eyJ...)>
CRON_SECRET=<opcional: protege los endpoints de cron>
```

Nota: están marcadas *sensitive* en Vercel — `vercel env pull` las baja vacías;
solo el runtime las ve.

## Emails de invitación

- Plantilla: `docs/supabase-invite-email-template.html` → pegar en
  Supabase → Authentication → Emails → Templates → **Invite user**.
- La URL de redirección `/bienvenida` debe estar permitida en
  Supabase → Authentication → URL Configuration → **Redirect URLs**
  (ej: `https://tu-dominio.vercel.app/bienvenida`).
- Si el SMTP no está configurado (o Resend sin dominio verificado), la app
  igual genera un **link de invitación copiable** para mandar por WhatsApp.

## Dólar

`organization.dollar_rate` es el valor efectivo. `dollar_rate_source`:
`auto` (cron diario + refresh al abrir dashboard si +6 hs, dolarapi.com blue)
o `manual` (override del Admin, el cron no lo pisa).

## Admin

`lepemate1310@gmail.com` recibe rol `Admin` automáticamente al registrarse
(trigger `handle_new_agent()`). El resto entra como `Agente` o con el rol
elegido al invitarlo.
