import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Elimina un agente del equipo (solo Admin). Sus leads vuelven al pozo.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: caller } = await supabase
    .from('agents')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single()
  if (caller?.role !== 'Admin') {
    return NextResponse.json({ error: 'Necesitás permisos de administrador' }, { status: 403 })
  }

  const { id } = await req.json().catch(() => ({ id: null }))
  if (!id) return NextResponse.json({ error: 'Falta el id del agente' }, { status: 400 })
  if (id === caller.id) {
    return NextResponse.json({ error: 'No podés eliminarte a vos mismo.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: target } = await admin.from('agents').select('*').eq('id', id).maybeSingle()
  if (!target) return NextResponse.json({ error: 'Agente no encontrado' }, { status: 404 })

  // 1. Sus leads vuelven al pozo (sin dueño), para no perderlos.
  await admin
    .from('leads')
    .update({ owner_id: null, agent_id: null, status_asignacion: 'pool' })
    .or(`owner_id.eq.${id},agent_id.eq.${id}`)

  // 2. Borrar. Si tiene login, borrar el auth user (cascadea la fila de agents);
  //    si es demo sin login, borrar la fila directamente.
  if (target.auth_user_id) {
    const { error } = await admin.auth.admin.deleteUser(target.auth_user_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // por las dudas, limpiar la fila si no cascadeó
    await admin.from('agents').delete().eq('id', id)
  } else {
    const { error } = await admin.from('agents').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
