import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: agent } = await supabase
    .from('agents')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  return (
    <div className="app-shell">
      <Sidebar agent={agent} />
      <main className="app-main">{children}</main>
    </div>
  )
}
