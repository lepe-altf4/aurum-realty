import { createAdminClient } from '@/lib/supabase/admin'
import { getViewer, leadOwnerId } from '@/lib/viewer'
import PipelineView from '@/components/pipeline/pipeline-view'
import type { Lead } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
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

  const [leadsRes, stagesRes, agentsRes, orgRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*, property:properties(*), stage:pipeline_stages(*), agent:agents(*)')
      .order('created_at', { ascending: false }),
    supabase.from('pipeline_stages').select('*').order('position'),
    supabase.from('agents').select('*').eq('status', 'Activo'),
    supabase.from('organization').select('dollar_rate').limit(1).single(),
  ])

  if (leadsRes.error) {
    console.error('[PipelinePage] leads query error:', leadsRes.error)
  }

  // El Admin ve todo el pipeline; cada agente, solo sus leads (filtro server-side).
  const all = (leadsRes.data ?? []) as Lead[]
  const visible = isAdmin ? all : all.filter(l => leadOwnerId(l) === viewer?.id)

  return (
    <PipelineView
      initialLeads={visible}
      stages={stagesRes.data ?? []}
      agents={agentsRes.data ?? []}
      dollarRate={orgRes.data?.dollar_rate ?? 0}
    />
  )
}
