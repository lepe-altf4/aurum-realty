import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find agent by auth_user_id first, fall back to email match
  // (handles users who registered before the trigger was set up)
  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .order('auth_user_id', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="app-shell">
      <Sidebar agent={agent} />
      <main className="app-main">{children}</main>
    </div>
  )
}
