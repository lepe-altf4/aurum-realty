import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// ⚠️ TEMPORAL — verifica que las queries con embed desambiguado devuelvan filas.
// Se elimina apenas confirmemos el fix.
const DIAG_TOKEN = 'diag-7f3a9c1e4b8d2065a1f0c9e7d3b5a482'

export async function GET(req: Request) {
  if (req.headers.get('x-diag-token') !== DIAG_TOKEN) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const admin = createAdminClient()
  const out: Record<string, unknown> = {}

  // Query EXACTA del pozo (leads con embed desambiguado)
  const pozo = await admin
    .from('leads')
    .select('*, property:properties(*), stage:pipeline_stages(*), agent:agents!agent_id(*)')
    .in('status_asignacion', ['pool', 'pendiente_aprobacion'])
  out.pozo = pozo.error ? { ERROR: pozo.error.message } : { rows: pozo.data?.length, sample: pozo.data?.[0]?.name }

  // Query EXACTA de Mis Leads (mismo embed)
  const mis = await admin
    .from('leads')
    .select('*, property:properties(*), stage:pipeline_stages(*), agent:agents!agent_id(*)')
  out.mis_leads = mis.error ? { ERROR: mis.error.message } : { rows: mis.data?.length }

  // Query EXACTA de claims (lead_claims con agente desambiguado)
  const claims = await admin
    .from('lead_claims')
    .select('*, lead:leads(*), agente:agents!agente_id(*)')
    .eq('estado', 'pendiente')
  out.claims = claims.error ? { ERROR: claims.error.message } : { rows: claims.data?.length, agente: (claims.data?.[0] as { agente?: { name?: string } })?.agente?.name }

  return NextResponse.json(out)
}
