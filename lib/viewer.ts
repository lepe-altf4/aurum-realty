import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Agent } from '@/lib/types'

/**
 * Identifica al usuario logueado y su agente en el servidor.
 * - El user sale de la sesión (cookies) — verificado por el middleware/layout.
 * - El agente se busca con el admin-client (bypasea RLS, lectura confiable),
 *   con fallback por email por si la fila no quedó linkeada a auth_user_id.
 *
 * Las páginas usan esto para filtrar por rol/dueño en código de confianza,
 * en vez de depender de las funciones RLS en reads del servidor (que en
 * Server Components pueden devolver vacío).
 */
export async function getViewer(): Promise<{ agent: Agent | null; isAdmin: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { agent: null, isAdmin: false }

  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('agents')
      .select('*')
      .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
      .order('auth_user_id', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()
    return { agent: (data as Agent) ?? null, isAdmin: data?.role === 'Admin' }
  } catch {
    return { agent: null, isAdmin: false }
  }
}

/** id de dueño efectivo de un lead (owner_id, o agent_id legacy como respaldo). */
export function leadOwnerId(lead: { owner_id?: string | null; agent_id: string | null }): string | null {
  return lead.owner_id !== undefined && lead.owner_id !== null ? lead.owner_id : lead.agent_id
}
