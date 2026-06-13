import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient, User } from '@supabase/supabase-js'

const VALID_ROLES = ['Admin', 'Agente'] as const
type Role = (typeof VALID_ROLES)[number]

async function findAuthUser(admin: SupabaseClient, email: string): Promise<User | null> {
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  return data?.users.find(u => u.email?.toLowerCase() === email) ?? null
}

// Alta de agente por INVITACIÓN, basada en link (no depende del SMTP de Supabase,
// que no está configurado). generateLink crea el usuario y devuelve un link
// que el Admin comparte por WhatsApp; la persona entra y crea su contraseña.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: caller } = await supabase.from('agents').select('role').eq('auth_user_id', user.id).single()
  if (caller?.role !== 'Admin') {
    return NextResponse.json({ error: 'Necesitás permisos de administrador' }, { status: 403 })
  }

  let body: { name?: string; email?: string; role?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }

  const name = (body.name ?? '').trim()
  const email = (body.email ?? '').trim().toLowerCase()
  const role = (body.role ?? 'Agente') as Role

  if (!name || !email) return NextResponse.json({ error: 'Nombre y email son obligatorios' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  if (!VALID_ROLES.includes(role)) return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })

  const initials = (name.split(/\s+/).map(p => p[0] ?? '').join('').slice(0, 2) || name.slice(0, 2)).toUpperCase()

  const admin = createAdminClient()
  const meta = { name, role, initials }
  const origin = req.headers.get('origin') ?? new URL(req.url).origin
  const redirectTo = `${origin}/bienvenida`

  const existing = await findAuthUser(admin, email)
  if (existing?.email_confirmed_at) {
    return NextResponse.json({ error: 'Ya existe un usuario activo con ese email.' }, { status: 409 })
  }

  // Usuario nuevo → invite (crea el usuario). Ya invitado sin confirmar → magiclink (re-link).
  const { data, error } = await admin.auth.admin.generateLink(
    existing
      ? { type: 'magiclink', email, options: { redirectTo } }
      : { type: 'invite', email, options: { data: meta, redirectTo } }
  )
  if (error) {
    console.error('[invite] generateLink failed', { email, exists: !!existing, message: error.message })
    return NextResponse.json({ error: `No se pudo generar la invitación: ${error.message}` }, { status: 500 })
  }
  const inviteLink = data.properties?.action_link ?? null

  // El trigger on_auth_user_created crea la fila de agents para usuarios nuevos.
  let { data: agent } = await admin.from('agents').select('*').eq('email', email).maybeSingle()
  if (!agent) {
    const ins = await admin.from('agents')
      .insert({ email, name, role, initials, status: 'Pendiente' })
      .select('*').single()
    agent = ins.data
  }

  if (!agent) {
    return NextResponse.json({ error: 'Invitación creada pero no pude leer el agente. Recargá la página.' }, { status: 500 })
  }

  return NextResponse.json({
    agent,
    invite_link: inviteLink,
    notice: 'Invitación lista. Compartí este link con la persona: entra, crea su contraseña y queda dentro del CRM.',
  }, { status: 201 })
}
