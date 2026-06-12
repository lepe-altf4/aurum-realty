import { createAdminClient } from '@/lib/supabase/admin'
import { getViewer, leadOwnerId } from '@/lib/viewer'
import LeadsHub from '@/components/leads/leads-hub'
import type { Lead } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const { agent: viewer, isAdmin } = await getViewer()

  let supabase
  try {
    supabase = createAdminClient()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return (
      <div className="p-8 text-red-600">
        <h2 className="text-xl font-bold mb-2">Configuration Error</h2>
        <p className="font-mono text-sm">{msg}</p>
      </div>
    )
  }

  const [leadsRes, stagesRes, agentsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*, property:properties(*), stage:pipeline_stages(*), agent:agents(*)')
      .order('created_at', { ascending: false }),
    supabase.from('pipeline_stages').select('*').order('position'),
    supabase.from('agents').select('*').eq('status', 'Activo').order('name'),
  ])

  if (leadsRes.error) {
    console.error('[LeadsPage] leads query error:', leadsRes.error)
  }

  // "Mis Leads" = leads con dueño asignado. El Admin ve los de todo el equipo;
  // cada agente ve solo los suyos. El filtro vive en el servidor (confiable),
  // el browser nunca recibe leads ajenos.
  const all = (leadsRes.data ?? []) as Lead[]
  const owned = all.filter(l => {
    const ownerId = leadOwnerId(l)
    if (!ownerId) return false
    if (l.status_asignacion && l.status_asignacion !== 'asignado') return false
    return isAdmin || ownerId === viewer?.id
  })

  return (
    <LeadsHub
      initialLeads={owned}
      stages={stagesRes.data ?? []}
      agents={agentsRes.data ?? []}
      viewer={viewer}
      isAdmin={isAdmin}
    />
  )
}
