import { createAdminClient } from '@/lib/supabase/admin'
import PipelineView from '@/components/pipeline/pipeline-view'

export default async function PipelinePage() {
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
    supabase.from('agents').select('*').eq('status', 'Activo'),
  ])

  if (leadsRes.error) {
    console.error('[PipelinePage] leads query error:', leadsRes.error)
  }

  return (
    <PipelineView
      initialLeads={leadsRes.data ?? []}
      stages={stagesRes.data ?? []}
      agents={agentsRes.data ?? []}
    />
  )
}
