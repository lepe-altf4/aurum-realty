import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fetchBlueRate } from '@/lib/dollar'

export const dynamic = 'force-dynamic'

async function refreshRate(opts: { force: boolean }) {
  const admin = createAdminClient()
  const { data: org, error } = await admin.from('organization').select('*').limit(1).single()
  if (error || !org) {
    return NextResponse.json({ error: 'No se pudo leer la organización' }, { status: 500 })
  }

  // En modo manual el cron no pisa el valor; solo un force explícito (botón Admin).
  if (org.dollar_rate_source === 'manual' && !opts.force) {
    return NextResponse.json({ skipped: true, reason: 'override manual activo', dollar_rate: org.dollar_rate })
  }

  const rate = await fetchBlueRate()
  if (!rate) {
    return NextResponse.json({ error: 'dolarapi.com no respondió' }, { status: 502 })
  }

  const { data: updated, error: upErr } = await admin
    .from('organization')
    .update({ dollar_rate: rate, dollar_rate_updated_at: new Date().toISOString(), dollar_rate_source: 'auto' })
    .eq('id', org.id)
    .select()
    .single()

  if (upErr) {
    // Columnas nuevas ausentes (migración sin correr): guardar solo el valor.
    if (/dollar_rate_source|dollar_rate_updated_at|schema cache/i.test(upErr.message)) {
      await admin.from('organization').update({ dollar_rate: rate }).eq('id', org.id)
      return NextResponse.json({ dollar_rate: rate, warning: 'Corré supabase/policies_leads.sql para habilitar metadata de actualización' })
    }
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  return NextResponse.json({
    dollar_rate: updated?.dollar_rate ?? rate,
    dollar_rate_updated_at: updated?.dollar_rate_updated_at,
    dollar_rate_source: updated?.dollar_rate_source,
  })
}

// GET: usado por el cron de Vercel (diario). Respeta el override manual.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }
  return refreshRate({ force: false })
}

// POST: botón "Actualizar ahora" del Admin. Vuelve a modo automático.
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: caller } = await supabase
    .from('agents')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()
  if (caller?.role !== 'Admin') {
    return NextResponse.json({ error: 'Necesitás permisos de administrador' }, { status: 403 })
  }

  return refreshRate({ force: true })
}
