import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Sidebar from '@/components/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Auth check uses the user's own session (cookie-based)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Data fetch uses admin client (bypasses RLS — safe because auth is already verified above)
  // If the service role key is misconfigured we still render the shell without agent data.
  let agent = null
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('agents')
      .select('*')
      .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
      .order('auth_user_id', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()
    agent = data
  } catch (err) {
    console.error('[AppLayout] createAdminClient error:', err)
  }

  return (
    <div className="app-shell">
      <Sidebar agent={agent} />
      <main className="app-main">{children}</main>
    </div>
  )
}
