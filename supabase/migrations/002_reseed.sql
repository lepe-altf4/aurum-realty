-- ============================================================
-- Aurum Realty CRM — Idempotent reseed + RLS fix
-- Run this AFTER 001_initial.sql to guarantee:
--   1. All RLS policies exist (drops + recreates safely)
--   2. Demo data is present (12 properties + 5 agents + 12 leads)
-- Safe to run multiple times.
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- 1. RLS — drop + recreate (idempotent)
-- ──────────────────────────────────────────────────────────────
alter table pipeline_stages enable row level security;
alter table agents          enable row level security;
alter table organization    enable row level security;
alter table properties      enable row level security;
alter table leads           enable row level security;
alter table activities      enable row level security;

drop policy if exists "Public read stages"     on pipeline_stages;
drop policy if exists "Auth manage stages"     on pipeline_stages;
drop policy if exists "Auth read agents"       on agents;
drop policy if exists "Auth insert agents"     on agents;
drop policy if exists "Auth update agents"     on agents;
drop policy if exists "Auth delete agents"     on agents;
drop policy if exists "Auth read org"          on organization;
drop policy if exists "Auth update org"        on organization;
drop policy if exists "Auth insert org"        on organization;
drop policy if exists "Auth read properties"   on properties;
drop policy if exists "Auth insert properties" on properties;
drop policy if exists "Auth update properties" on properties;
drop policy if exists "Auth delete properties" on properties;
drop policy if exists "Auth read leads"        on leads;
drop policy if exists "Auth insert leads"      on leads;
drop policy if exists "Auth update leads"      on leads;
drop policy if exists "Auth delete leads"      on leads;
drop policy if exists "Auth read activities"   on activities;
drop policy if exists "Auth insert activities" on activities;
drop policy if exists "Auth delete activities" on activities;

create policy "Public read stages"     on pipeline_stages for select using (true);
create policy "Auth manage stages"     on pipeline_stages for all    using (auth.role() = 'authenticated');

create policy "Auth read agents"       on agents       for select using (auth.role() = 'authenticated');
create policy "Auth insert agents"     on agents       for insert with check (auth.role() = 'authenticated');
create policy "Auth update agents"     on agents       for update using (auth.role() = 'authenticated');
create policy "Auth delete agents"     on agents       for delete using (auth.role() = 'authenticated');

create policy "Auth read org"          on organization for select using (auth.role() = 'authenticated');
create policy "Auth insert org"        on organization for insert with check (auth.role() = 'authenticated');
create policy "Auth update org"        on organization for update using (auth.role() = 'authenticated');

create policy "Auth read properties"   on properties   for select using (auth.role() = 'authenticated');
create policy "Auth insert properties" on properties   for insert with check (auth.role() = 'authenticated');
create policy "Auth update properties" on properties   for update using (auth.role() = 'authenticated');
create policy "Auth delete properties" on properties   for delete using (auth.role() = 'authenticated');

create policy "Auth read leads"        on leads        for select using (auth.role() = 'authenticated');
create policy "Auth insert leads"      on leads        for insert with check (auth.role() = 'authenticated');
create policy "Auth update leads"      on leads        for update using (auth.role() = 'authenticated');
create policy "Auth delete leads"      on leads        for delete using (auth.role() = 'authenticated');

create policy "Auth read activities"   on activities   for select using (auth.role() = 'authenticated');
create policy "Auth insert activities" on activities   for insert with check (auth.role() = 'authenticated');
create policy "Auth delete activities" on activities   for delete using (auth.role() = 'authenticated');

-- ──────────────────────────────────────────────────────────────
-- 2. Organization — ensure exists
-- ──────────────────────────────────────────────────────────────
insert into organization (name, cuit, address, dollar_rate)
select 'Soules Inmobiliaria', '30-71204938-2', '9 de Julio 376, Cipolletti, Río Negro', 1245
where not exists (select 1 from organization);

-- ──────────────────────────────────────────────────────────────
-- 3. Pipeline stages — ensure exists
-- ──────────────────────────────────────────────────────────────
insert into pipeline_stages (name, position, key) values
  ('Consulta',  1, 'consulta'),
  ('Visita',    2, 'visita'),
  ('Oferta',    3, 'oferta'),
  ('Reserva',   4, 'reserva'),
  ('Escritura', 5, 'escritura')
on conflict (key) do nothing;

-- ──────────────────────────────────────────────────────────────
-- 4. Agents — 5 demo agents (idempotent via email unique)
-- ──────────────────────────────────────────────────────────────
insert into agents (name, email, role, commission_pct, status, initials) values
  ('Mariana Pérez',      'mariana@aurum.com.ar',  'Senior', 3.5, 'Activo', 'MP'),
  ('Joaquín Tarantini',  'joaquin@aurum.com.ar',  'Senior', 3.5, 'Activo', 'JT'),
  ('Valentina Sosa',     'valentina@aurum.com.ar','Agente', 3.0, 'Activo', 'VS'),
  ('Lucas Rivera',       'lucas@aurum.com.ar',    'Agente', 3.0, 'Activo', 'LR'),
  ('Camila Funes',       'camila@aurum.com.ar',   'Junior', 2.5, 'Activo', 'CF')
on conflict (email) do nothing;

-- ──────────────────────────────────────────────────────────────
-- 5. Properties — 12 properties (idempotent via address check)
-- ──────────────────────────────────────────────────────────────
insert into properties (address, neighborhood, type, operation, price_usd, price_ars, currency_listing, sqm, rooms, status, premium, photo_url)
select * from (values
  ('Av. del Libertador 4820 · 8°B', 'Palermo Chico',     'Departamento', 'Venta',    485000::numeric,   604325000::numeric, 'USD', 142::numeric, 4, 'Disponible', true,  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=150&fit=crop&auto=format'),
  ('Los Cipreses 322',               'Nordelta',           'Casa',         'Venta',    920000::numeric,  1145400000::numeric, 'USD', 380::numeric, 6, 'Reservada',  true,  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=200&h=150&fit=crop&auto=format'),
  ('Arenales 1980 · 5°A',            'Recoleta',           'Departamento', 'Venta',    320000::numeric,   398400000::numeric, 'USD',  96::numeric, 3, 'Disponible', false, 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&h=150&fit=crop&auto=format'),
  ('Honduras 4321 · 2°C',            'Palermo Soho',       'Departamento', 'Alquiler', 1450::numeric,      1805250::numeric, 'ARS',  58::numeric, 2, 'Disponible', false, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200&h=150&fit=crop&auto=format'),
  ('Barrio Los Sauces, Lote 14',     'Pilar',              'Lote',         'Venta',    215000::numeric,   267675000::numeric, 'USD', 1200::numeric, 0,'Disponible', false, 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=200&h=150&fit=crop&auto=format'),
  ('Av. Santa Fe 2580 PB',           'Barrio Norte',       'Local',        'Alquiler', 3370::numeric,      4195650::numeric, 'ARS', 110::numeric, 1, 'Disponible', false, 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=200&h=150&fit=crop&auto=format'),
  ('Juncal 1150 · 12°',              'Retiro',             'Departamento', 'Venta',    690000::numeric,   859050000::numeric, 'USD', 184::numeric, 5, 'Vendida',    true,  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=200&h=150&fit=crop&auto=format'),
  ('Calle 8 entre 32 y 33',          'La Plata',           'Casa',         'Venta',    229000::numeric,   285105000::numeric, 'ARS', 240::numeric, 5, 'Disponible', false, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=200&h=150&fit=crop&auto=format'),
  ('Gorriti 5440 · 4°',              'Palermo Hollywood',  'Departamento', 'Alquiler', 2400::numeric,      2988000::numeric, 'USD',  72::numeric, 2, 'Reservada',  false, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&h=150&fit=crop&auto=format'),
  ('Av. Alvear 1755 · 9°',           'Recoleta',           'Departamento', 'Venta',   1450000::numeric,  1805250000::numeric,'USD', 220::numeric, 5, 'Disponible', true,  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&h=150&fit=crop&auto=format'),
  ('Las Acacias 102',                'Cariló',             'Lote',         'Venta',    180000::numeric,   224100000::numeric, 'USD', 950::numeric, 0, 'Disponible', false, 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?w=200&h=150&fit=crop&auto=format'),
  ('Av. Cabildo 1840',               'Belgrano',           'Local',        'Alquiler', 2570::numeric,      3199650::numeric, 'ARS',  78::numeric, 1, 'Alquilada',  false, 'https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=200&h=150&fit=crop&auto=format')
) as v(address, neighborhood, type, operation, price_usd, price_ars, currency_listing, sqm, rooms, status, premium, photo_url)
where not exists (select 1 from properties p where p.address = v.address);

-- ──────────────────────────────────────────────────────────────
-- 6. Leads — 12 leads (idempotent via name+phone check)
-- ──────────────────────────────────────────────────────────────
do $$
declare
  s_consulta  uuid; s_visita   uuid; s_oferta   uuid;
  s_reserva   uuid; s_escritura uuid;
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid; p6 uuid;
  p7 uuid; p8 uuid; p9 uuid; p10 uuid; p11 uuid; p12 uuid;
  a1 uuid; a2 uuid; a3 uuid; a4 uuid; a5 uuid;
begin
  select id into s_consulta  from pipeline_stages where key = 'consulta';
  select id into s_visita    from pipeline_stages where key = 'visita';
  select id into s_oferta    from pipeline_stages where key = 'oferta';
  select id into s_reserva   from pipeline_stages where key = 'reserva';
  select id into s_escritura from pipeline_stages where key = 'escritura';

  select id into p1  from properties where address = 'Av. del Libertador 4820 · 8°B';
  select id into p2  from properties where address = 'Los Cipreses 322';
  select id into p3  from properties where address = 'Arenales 1980 · 5°A';
  select id into p4  from properties where address = 'Honduras 4321 · 2°C';
  select id into p5  from properties where address = 'Barrio Los Sauces, Lote 14';
  select id into p6  from properties where address = 'Av. Santa Fe 2580 PB';
  select id into p7  from properties where address = 'Juncal 1150 · 12°';
  select id into p8  from properties where address = 'Calle 8 entre 32 y 33';
  select id into p9  from properties where address = 'Gorriti 5440 · 4°';
  select id into p10 from properties where address = 'Av. Alvear 1755 · 9°';
  select id into p11 from properties where address = 'Las Acacias 102';
  select id into p12 from properties where address = 'Av. Cabildo 1840';

  select id into a1 from agents where email = 'mariana@aurum.com.ar';
  select id into a2 from agents where email = 'joaquin@aurum.com.ar';
  select id into a3 from agents where email = 'valentina@aurum.com.ar';
  select id into a4 from agents where email = 'lucas@aurum.com.ar';
  select id into a5 from agents where email = 'camila@aurum.com.ar';

  -- Only insert leads if there are fewer than 12 demo leads
  if (select count(*) from leads) < 12 then
    -- Wipe any partial inserts first to keep set consistent
    delete from leads where phone in (
      '+54 9 11 5234-1180','+54 9 11 4192-7755','+54 9 11 6711-2204',
      '+54 9 11 5566-8821','+54 9 11 3098-4412','+54 9 11 2745-9908',
      '+54 9 11 8123-4400','+54 9 11 5512-3399','+54 9 11 6098-1145',
      '+54 9 11 4438-7720','+54 9 11 7821-3009','+54 9 11 3344-5567'
    );

    insert into leads (name, phone, email, origin, property_id, operation, stage_id, agent_id, amount, currency, hot, score, days_without_contact, next_action_date, notes) values
      ('Ramiro Achával',    '+54 9 11 5234-1180', 'r.achaval@gmail.com',        'WhatsApp',  p1,  'Venta',    s_oferta,    a1, 485000, 'USD', true,  92, 1, current_date + 1, 'Cliente con preaprobación bancaria. Pidió cocheras adicionales.'),
      ('Florencia Bianchi', '+54 9 11 4192-7755', 'flor.bianchi@hotmail.com',   'Instagram', p4,  'Alquiler', s_visita,    a3, 1800,   'ARS', false, 64, 0, current_date,     'Mudanza desde Córdoba en julio. Necesita pet-friendly.'),
      ('Damián Ortega',     '+54 9 11 6711-2204', 'd.ortega@estudio.law',       'ZonaProp',  p10, 'Venta',    s_reserva,   a2, 1450000,'USD', true,  88, 0, current_date + 2, 'Inversor. Solicita firma de boleto la próxima semana.'),
      ('Sofía Larrañaga',   '+54 9 11 5566-8821', 'sofi.l@gmail.com',           'Web',       p3,  'Venta',    s_consulta,  a3, 320000, 'USD', false, 45, 3, current_date + 3, 'Primera vivienda. Crédito UVA en evaluación.'),
      ('Martín Iraola',     '+54 9 11 3098-4412', 'miraola@gmail.com',          'Referido',  p2,  'Venta',    s_visita,    a1, 920000, 'USD', true,  78, 2, current_date,     'Referido por Lucía Méndez (cliente 2024).'),
      ('Constanza Vega',    '+54 9 11 2745-9908', 'c.vega@outlook.com',         'Argenprop', p9,  'Alquiler', s_oferta,    a4, 2200,   'USD', false, 55, 5, current_date + 1, 'Ofertó USD 2200/mes. Esperando garantía propietaria.'),
      ('Federico Salgado',  '+54 9 11 8123-4400', 'fede.salgado@gmail.com',     'WhatsApp',  p5,  'Venta',    s_consulta,  a2, 215000, 'USD', false, 40, 4, current_date + 5, 'Consulta por lotes en Pilar. Comparando con Nordelta.'),
      ('Lucía Méndez',      '+54 9 11 5512-3399', 'lu.mendez@gmail.com',        'Instagram', p6,  'Alquiler', s_consulta,  a5, 4200,   'ARS', false, 35, 8, current_date + 3, 'Quiere visitar el local el sábado. Pendiente.'),
      ('Tomás Aguirre',     '+54 9 11 6098-1145', 't.aguirre@empresa.com.ar',   'Web',       p7,  'Venta',    s_escritura, a2, 690000, 'USD', false, 95, 0, current_date,     'Escritura programada 22/05 en escribanía Otero.'),
      ('Renata Cipriani',   '+54 9 11 4438-7720', 'renatac@gmail.com',          'ZonaProp',  p8,  'Venta',    s_visita,    a3, 229000, 'USD', false, 52, 6, current_date + 2, 'Visitó dos veces. Pidió escritura prolija al propietario.'),
      ('Esteban Quesada',   '+54 9 11 7821-3009', 'e.quesada@gmail.com',        'Referido',  p11, 'Venta',    s_oferta,    a1, 180000, 'USD', true,  81, 2, current_date + 1, 'Oferta en firme. Espera contraoferta del propietario.'),
      ('Pilar Etcheverry',  '+54 9 11 3344-5567', 'p.etcheverry@gmail.com',     'Argenprop', p12, 'Alquiler', s_consulta,  a5, 3200,   'ARS', false, 30, 9, current_date + 4, 'Solicitud por mail. Sin responder.');
  end if;
end;
$$;

-- ──────────────────────────────────────────────────────────────
-- 7. Sample activities for first lead (idempotent — only if none)
-- ──────────────────────────────────────────────────────────────
do $$
declare
  v_lead_id  uuid;
  v_agent_id uuid;
  v_count    integer;
begin
  select id into v_lead_id  from leads where name = 'Ramiro Achával' limit 1;
  select id into v_agent_id from agents where email = 'mariana@aurum.com.ar' limit 1;
  if v_lead_id is null or v_agent_id is null then return; end if;
  select count(*) into v_count from activities where lead_id = v_lead_id;
  if v_count > 0 then return; end if;

  insert into activities (lead_id, agent_id, type, description, created_at) values
    (v_lead_id, v_agent_id, 'Llamada',      'Llamado de seguimiento. Cliente confirma intención de compra.',   now() - interval '2 hours'),
    (v_lead_id, v_agent_id, 'Cambio_etapa', 'Lead movido a etapa Oferta.',                                    now() - interval '4 hours'),
    (v_lead_id, v_agent_id, 'Email',        'Envío de propuesta económica formal por mail.',                   now() - interval '1 day'),
    (v_lead_id, v_agent_id, 'Visita',       'Visita realizada al departamento. Cliente trajo a su esposa.',    now() - interval '2 days'),
    (v_lead_id, v_agent_id, 'WhatsApp',     'Mensaje automático de bienvenida enviado.',                       now() - interval '5 days');
end;
$$;

-- ──────────────────────────────────────────────────────────────
-- 8. Verification — counts you should see in the output
-- ──────────────────────────────────────────────────────────────
select
  (select count(*) from organization)    as orgs,
  (select count(*) from pipeline_stages) as stages,
  (select count(*) from agents)          as agents,
  (select count(*) from properties)      as properties,
  (select count(*) from leads)           as leads,
  (select count(*) from activities)      as activities;
