import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GET: cron diario de Vercel. Recalcula days_without_contact de todos
// los leads a partir de last_contact_at (ver migración 004).
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
  }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('refresh_days_without_contact')

  if (error) {
    // Función ausente → la migración 004 no corrió todavía
    if (/refresh_days_without_contact|schema cache|does not exist/i.test(error.message)) {
      return NextResponse.json(
        { error: 'Falta correr supabase/migrations/004_days_sin_contacto.sql en Supabase' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ leads_actualizados: data ?? 0 })
}
