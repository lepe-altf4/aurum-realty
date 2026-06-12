-- ============================================================
-- Storage — bucket `property-photos` para fotos de propiedades
-- Correr COMPLETO en el Supabase SQL Editor. Idempotente.
--
-- - Lectura pública (las fotos se sirven por URL pública).
-- - Subir / actualizar / borrar: solo agentes reales de la
--   organización (usuario autenticado con fila en `agents`).
--
-- Requiere public.current_agent_id() (creada en policies_leads.sql).
-- ============================================================

-- 1. Bucket público
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do update set public = true;

-- 2. Policies sobre storage.objects acotadas a este bucket
drop policy if exists "property-photos public read"  on storage.objects;
drop policy if exists "property-photos agent insert"  on storage.objects;
drop policy if exists "property-photos agent update"  on storage.objects;
drop policy if exists "property-photos agent delete"  on storage.objects;

create policy "property-photos public read" on storage.objects
  for select
  using (bucket_id = 'property-photos');

create policy "property-photos agent insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'property-photos' and public.current_agent_id() is not null);

create policy "property-photos agent update" on storage.objects
  for update to authenticated
  using (bucket_id = 'property-photos' and public.current_agent_id() is not null)
  with check (bucket_id = 'property-photos' and public.current_agent_id() is not null);

create policy "property-photos agent delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'property-photos' and public.current_agent_id() is not null);

-- 3. Verificación
select id, public from storage.buckets where id = 'property-photos';
