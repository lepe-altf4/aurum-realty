-- ──────────────────────────────────────────────────────────────
-- Migration 003 — Agent invitations
-- Adds 'Pendiente' status, makes handle_new_agent honour the role
-- and name set by inviteUserByEmail (raw_user_meta_data), and flips
-- agents.status from Pendiente → Activo once the user confirms email.
-- ──────────────────────────────────────────────────────────────

-- 1. Allow 'Pendiente' as a valid agents.status
alter table public.agents
  drop constraint if exists agents_status_check;
alter table public.agents
  add constraint agents_status_check
  check (status in ('Activo','Inactivo','Pendiente'));

-- 2. Rebuild handle_new_agent so it:
--    - reads name / role / initials from raw_user_meta_data when present
--    - marks status='Pendiente' when the auth user is still unconfirmed
--      (i.e. just invited), otherwise 'Activo' (self-signup flow)
create or replace function public.handle_new_agent()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  full_name      text;
  user_role      text;
  user_initials  text;
  agent_status   text;
begin
  full_name := coalesce(
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  user_role := coalesce(
    new.raw_user_meta_data->>'role',
    case when new.email = 'lepemate1310@gmail.com' then 'Admin' else 'Agente' end
  );

  user_initials := coalesce(
    new.raw_user_meta_data->>'initials',
    upper(
      substring(full_name, 1, 1) ||
      coalesce(substring(split_part(full_name, ' ', 2), 1, 1), '')
    )
  );

  agent_status := case
    when new.email_confirmed_at is null then 'Pendiente'
    else 'Activo'
  end;

  insert into public.agents (auth_user_id, name, email, role, initials, status)
  values (new.id, full_name, new.email, user_role, user_initials, agent_status)
  on conflict (email) do update
    set auth_user_id = excluded.auth_user_id,
        -- Preserve manually-edited role/name unless the agent was Pendiente
        name         = case when agents.status = 'Pendiente' then excluded.name     else agents.name     end,
        role         = case when agents.status = 'Pendiente' then excluded.role     else agents.role     end,
        initials     = case when agents.status = 'Pendiente' then excluded.initials else agents.initials end,
        status       = excluded.status;

  return new;
end;
$$;

-- 3. When an invited user confirms their email, flip Pendiente → Activo
create or replace function public.handle_agent_email_confirmed()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.email_confirmed_at is null
     and new.email_confirmed_at is not null then
    update public.agents
      set status = 'Activo'
      where auth_user_id = new.id
        and status = 'Pendiente';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row execute procedure public.handle_agent_email_confirmed();
