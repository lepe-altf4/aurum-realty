import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import AdminSettings from '@/components/settings/admin-settings'

export default async function SettingsPage() {
  const supabase = await createClient()
  const admin = createAdminClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  // Check if admin
  let isAdmin = false
  if (user) {
    const { data: agent } = await supabase
      .from('agents')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()
    isAdmin = agent?.role === 'Admin'
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontFamily: 'var(--font-jakarta)', fontSize: 22, marginBottom: 8 }}>Acceso denegado</h2>
        <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>Necesitás permisos de administrador para acceder a esta sección.</p>
      </div>
    )
  }

  const [orgRes, agentsRes, stagesRes] = await Promise.all([
    admin.from('organization').select('*').limit(1).single(),
    admin.from('agents').select('*').order('name'),
    admin.from('pipeline_stages').select('*').order('position'),
  ])

  const org = orgRes.data
  const agents = agentsRes.data ?? []
  const stages = stagesRes.data ?? []

  return <AdminSettings org={org} agents={agents} stages={stages} />
}
