import { createClient } from '@/lib/supabase/server'
import LeadsHub from '@/components/leads/leads-hub'
import type { Lead } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  // Lecturas con la sesión del usuario: RLS limita lo que cada rol ve.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: viewer } = await supabase
    .from('agents')
    .select('*')
    .eq('auth_user_id', user?.id ?? '')
    .maybeSingle()

  const isAdmin = viewer?.role === 'Admin'

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

  // "Mis Leads" = leads con dueño. Antes de correr la migración SQL,
  // owner_id no existe: cae al agente asignado (agent_id) como dueño.
  const all = (leadsRes.data ?? []) as Lead[]
  const owned = all.filter(l => {
    const ownerId = l.owner_id !== undefined ? l.owner_id : l.agent_id
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
