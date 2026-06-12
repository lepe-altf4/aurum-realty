import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_ROLES = ['Admin', 'Senior', 'Agente', 'Junior'] as const
const VALID_STATUS = ['Activo', 'Inactivo'] as const

// POST: actualiza rol / comisión / estado de un agente. Solo Admin.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const { data: caller } = await supabase
    .from('agents')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()
  if (caller?.role !== 'Admin') {
    return NextResponse.json({ error: 'Necesitás permisos de administrador' }, { status: 403 })
  }

  let body: { id?: string; role?: string; commission_pct?: number; status?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  if (!body.id) {
    return NextResponse.json({ error: 'Falta el id del agente' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}

  if (body.role !== undefined) {
    if (!VALID_ROLES.includes(body.role as typeof VALID_ROLES[number])) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }
    // Evitar que el Admin se saque su propio rol y deje la org sin dueño
    if (caller.id === body.id && body.role !== 'Admin') {
      return NextResponse.json({ error: 'No podés quitarte tu propio rol de Admin' }, { status: 400 })
    }
    updates.role = body.role
  }

  if (body.commission_pct !== undefined) {
    const pct = Number(body.commission_pct)
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      return NextResponse.json({ error: 'Comisión inválida (0 a 100)' }, { status: 400 })
    }
    updates.commission_pct = pct
  }

  if (body.status !== undefined) {
    if (!VALID_STATUS.includes(body.status as typeof VALID_STATUS[number])) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }
    if (caller.id === body.id && body.status === 'Inactivo') {
      return NextResponse.json({ error: 'No podés desactivarte a vos mismo' }, { status: 400 })
    }
    updates.status = body.status
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: agent, error } = await admin
    .from('agents')
    .update(updates)
    .eq('id', body.id)
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!agent) {
    return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })
  }

  return NextResponse.json({ agent })
}
