import { createClient } from '@/lib/supabase/server'
import PipelineView from '@/components/pipeline/pipeline-view'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  // Sesión del usuario: RLS limita los leads visibles según rol/dueño.
  const supabase = await createClient()

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

  return (
    <PipelineView
      initialLeads={leadsRes.data ?? []}
      stages={stagesRes.data ?? []}
      agents={agentsRes.data ?? []}
      dollarRate={orgRes.data?.dollar_rate ?? 0}
    />
  )
}
