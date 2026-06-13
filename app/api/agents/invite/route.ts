import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient, User } from '@supabase/supabase-js'

const VALID_ROLES = ['Admin', 'Agente'] as const
type Role = (typeof VALID_ROLES)[number]

// Busca un usuario de auth por email (no hay endpoint directo en supabase-js v2).
async function findAuthUser(admin: SupabaseClient, email: string): Promise<User | null> {
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  return data?.users.find(u => u.email?.toLowerCase() === email) ?? null
}

// Genera un link de invitación/acceso que el Admin puede copiar y mandar
// por WhatsApp. Funciona aunque el SMTP no esté configurado.
async function makeInviteLink(
  admin: SupabaseClient,
  email: string,
  meta: { name: string; role: Role; initials: string },
  redirectTo: string,
  userExists: boolean
): Promise<string | null> {
  const { data, error } = await admin.auth.admin.generateLink(
    userExists
      ? { type: 'magiclink', email, options: { redirectTo } }
      : { type: 'invite', email, options: { data: meta, redirectTo } }
  )
  if (error) {
    console.error('[invite] generateLink failed', { email, userExists, message: error.message })
    return null
  }
  return data.properties?.action_link ?? null
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: caller } = await supabase
    .from('agents')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()
  if (caller?.role !== 'Admin') {
    return NextResponse.json({ error: 'Necesitás permisos de administrador' }, { status: 403 })
  }

  let body: { name?: string; email?: string; role?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const name = (body.name ?? '').trim()
  const email = (body.email ?? '').trim().toLowerCase()
  const role = (body.role ?? 'Agente') as Role

  if (!name || !email) {
    return NextResponse.json({ error: 'Nombre y email son obligatorios' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const initials = (name
    .split(/\s+/)
    .map(p => p[0] ?? '')
    .join('')
    .slice(0, 2) || name.slice(0, 2)
  ).toUpperCase()

  const admin = createAdminClient()
  const meta = { name, role, initials }
  const origin = req.headers.get('origin') ?? new URL(req.url).origin
  // La página /bienvenida toma la sesión del link y pide crear contraseña.
  const redirectTo = `${origin}/bienvenida`

  // 1) Intento normal: crea el usuario Y manda el email (si hay SMTP sano)
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: meta,
    redirectTo,
  })

  let emailed = !inviteError
  let inviteLink: string | null = null
  let notice: string | null = null

  if (inviteError) {
    console.error('[invite] inviteUserByEmail failed', {
      email, status: inviteError.status, code: inviteError.code, message: inviteError.message,
    })

    const rawMsg = inviteError.message ?? ''
    const isDuplicate = inviteError.status === 422
      || inviteError.code === 'email_exists'
      || /already|exists|registered/i.test(rawMsg)
    const isSmtpFailure = /sending|smtp|email/i.test(rawMsg) && !isDuplicate

    if (isDuplicate) {
      const existing = await findAuthUser(admin, email)
      if (existing?.email_confirmed_at) {
        return NextResponse.json({ error: 'Ya existe un usuario activo con ese email.' }, { status: 409 })
      }
      // Existe pero nunca confirmó (invitación previa fallida/vencida):
      // regenerar link de acceso para reenviar a mano.
      inviteLink = await makeInviteLink(admin, email, meta, redirectTo, true)
      if (!inviteLink) {
        return NextResponse.json({ error: 'Ya existe una invitación pendiente y no pude regenerar el link.' }, { status: 500 })
      }
      notice = 'Ese email ya tenía una invitación pendiente. Te regeneré el link para que se lo mandes.'
    } else if (isSmtpFailure) {
      // El email no salió. GoTrue puede haber creado el usuario igual:
      // NO lo borramos — generamos un link manual que funciona siempre.
      const existing = await findAuthUser(admin, email)
      inviteLink = await makeInviteLink(admin, email, meta, redirectTo, !!existing)
      if (!inviteLink) {
        return NextResponse.json(
          { error: `No se pudo enviar el email ni generar link manual: ${rawMsg}` },
          { status: 500 }
        )
      }
      notice = 'El email automático falló (SMTP). Copiá el link y mandáselo por WhatsApp — funciona igual.'
    } else {
      return NextResponse.json({ error: rawMsg || 'Error desconocido al invitar' }, { status: inviteError.status ?? 500 })
    }
  }

  // El trigger on_auth_user_created creó/actualizó la fila de agents.
  const { data: agent, error: fetchError } = await admin
    .from('agents')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (fetchError || !agent) {
    return NextResponse.json(
      { error: 'Invitación creada pero no pude leer el agente. Recargá la página.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ agent, emailed, invite_link: inviteLink, notice }, { status: 201 })
}
