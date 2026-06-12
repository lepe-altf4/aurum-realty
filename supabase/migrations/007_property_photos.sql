-- ============================================================
-- Migración 007 — Fotos de propiedades (galería multi-foto)
-- Correr COMPLETO en el Supabase SQL Editor. Idempotente.
--
-- Modelo:
--   - Tabla property_photos: varias fotos por propiedad, ordenadas
--     por `position`. La de position más baja (0) es la PORTADA.
--   - properties.photo_url se mantiene como CACHÉ de la portada
--     (lo leen tabla de Propiedades, tarjetas de Pipeline, etc.),
--     así no hay que joinear property_photos en cada listado.
--
-- Requiere public.current_agent_id() (creada en policies_leads.sql).
-- ============================================================

create table if not exists public.property_photos (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references public.properties(id) on delete cascade,
  url          text not null,
  storage_path text,                          -- ruta dentro del bucket, para poder borrar el archivo
  position     integer not null default 0,    -- 0 = portada
  created_at   timestamptz not null default now()
);

create index if not exists property_photos_property_idx on public.property_photos(property_id);
create index if not exists property_photos_order_idx     on public.property_photos(property_id, position);

-- ──────────────────────────────────────────────────────────────
-- RLS: lectura para autenticados; escritura solo agentes reales
--      de la organización (current_agent_id() no nulo)
-- ──────────────────────────────────────────────────────────────
alter table public.property_photos enable row level security;

drop policy if exists "Photos read"   on public.property_photos;
drop policy if exists "Photos insert" on public.property_photos;
drop policy if exists "Photos update" on public.property_photos;
drop policy if exists "Photos delete" on public.property_photos;

create policy "Photos read"   on public.property_photos
  for select using (auth.role() = 'authenticated');

create policy "Photos insert" on public.property_photos
  for insert with check (public.current_agent_id() is not null);

create policy "Photos update" on public.property_photos
  for update using (public.current_agent_id() is not null)
            with check (public.current_agent_id() is not null);

create policy "Photos delete" on public.property_photos
  for delete using (public.current_agent_id() is not null);

-- ──────────────────────────────────────────────────────────────
-- Backfill: propiedades que ya tenían photo_url y no tienen filas
-- en property_photos → crear su portada (position 0).
-- ──────────────────────────────────────────────────────────────
insert into public.property_photos (property_id, url, position)
select p.id, p.photo_url, 0
  from public.properties p
 where p.photo_url is not null
   and not exists (select 1 from public.property_photos pp where pp.property_id = p.id);

-- ──────────────────────────────────────────────────────────────
-- VERIFICACIÓN
-- ──────────────────────────────────────────────────────────────
select
  (select count(*) from public.property_photos)                          as fotos,
  (select count(distinct property_id) from public.property_photos)       as propiedades_con_foto;
