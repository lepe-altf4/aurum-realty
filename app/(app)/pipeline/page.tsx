import { createClient } from '@/lib/supabase/server'
import PipelineView from '@/components/pipeline/pipeline-view'

export default async function PipelinePage() {
  const supabase = await createClient()
  const [
    { data: leads },
    { data: stages },
    { data: agents },
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('*, property:properties(*), stage:pipeline_stages(*), agent:agents(*)')
      .order('created_at', { ascending: false }),
    supabase.from('pipeline_stages').select('*').order('position'),
    supabase.from('agents').select('*').eq('status', 'Activo'),
  ])

  return <PipelineView initialLeads={leads ?? []} stages={stages ?? []} agents={agents ?? []} />
}
