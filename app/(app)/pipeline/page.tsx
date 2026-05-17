import { createAdminClient } from '@/lib/supabase/admin'
import PipelineView from '@/components/pipeline/pipeline-view'

export default async function PipelinePage() {
  const supabase = createAdminClient()

  const [leadsRes, stagesRes, agentsRes] = await Promise.all([
    supabase
      .from('leads')
      .select('*, property:properties(*), stage:pipeline_stages(*), agent:agents(*)')
      .order('created_at', { ascending: false }),
    supabase.from('pipeline_stages').select('*').order('position'),
    supabase.from('agents').select('*').eq('status', 'Activo'),
  ])

  return (
    <PipelineView
      initialLeads={leadsRes.data ?? []}
      stages={stagesRes.data ?? []}
      agents={agentsRes.data ?? []}
    />
  )
}
