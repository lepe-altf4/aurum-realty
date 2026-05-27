import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_ROLES = ['Admin', 'Senior', 'Agente', 'Junior'] as const
type Role = (typeof VALID_ROLES)[number]

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

  const origin = req.headers.get('origin')
    ?? new URL(req.url).origin
  const redirectTo = `${origin}/login`

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name, role, initials },
    redirectTo,
  })

  if (inviteError) {
    // Log everything we get back from Supabase so the real cause lands in
    // Vercel logs (the message surfaced to the client is often the generic
    // "Error sending invite email" that hides the SMTP provider's reason).
    console.error('[invite] supabase.auth.admin.inviteUserByEmail failed', {
      email,
      status: inviteError.status,
      code: inviteError.code,
      name: inviteError.name,
      message: inviteError.message,
    })

    const rawMsg = inviteError.message ?? ''
    const isSmtpFailure = /sending|smtp|email/i.test(rawMsg) && !/already|exists|registered/i.test(rawMsg)
    const isDuplicate = inviteError.status === 422
      || inviteError.code === 'email_exists'
      || /already|exists|registered/i.test(rawMsg)

    // When SMTP fails GoTrue often still creates the auth.users row before
    // it tries to send the email. That leaves an orphan unconfirmed user +
    // a Pendiente agents row that will block any retry. Clean both up.
    if (isSmtpFailure) {
      try {
        const { data: page } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
        const orphan = page?.users.find(u => u.email?.toLowerCase() === email)
        if (orphan) {
          await admin.auth.admin.deleteUser(orphan.id)
          // agents row cascades via auth_user_id FK (on delete cascade)
          // but it's wired through trigger insert, not FK on agents.id, so
          // also clean the row by email in case it was inserted independently.
          await admin.from('agents').delete().eq('email', email)
        }
      } catch (cleanupErr) {
        console.error('[invite] cleanup after SMTP failure failed', cleanupErr)
      }
    }

    let friendly = rawMsg
    if (isDuplicate) {
      friendly = 'Ya existe un usuario con ese email.'
    } else if (isSmtpFailure) {
      friendly =
        'No se pudo enviar el email. Revisá Supabase → Logs → Auth Logs ' +
        'para el motivo exacto. Causa más común: Resend con sender ' +
        '"onboarding@resend.dev" solo permite enviar al email dueño de la ' +
        'cuenta de Resend. Verificá un dominio propio en Resend para enviar ' +
        'a cualquier dirección.'
    }

    const status =
      isDuplicate ? 409 :
      inviteError.status ?? 500

    return NextResponse.json(
      { error: friendly, code: inviteError.code, raw: rawMsg },
      { status }
    )
  }

  // The on_auth_user_created trigger inserts the agents row from
  // raw_user_meta_data. Re-fetch so the client gets the final shape.
  const { data: agent, error: fetchError } = await admin
    .from('agents')
    .select('*')
    .eq('auth_user_id', invited.user.id)
    .single()

  if (fetchError || !agent) {
    return NextResponse.json(
      { error: 'Invitación enviada pero no pude leer el agente recién creado.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ agent }, { status: 201 })
}
