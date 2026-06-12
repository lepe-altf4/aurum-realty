import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Organization } from '@/lib/types'

const STALE_MS = 6 * 60 * 60 * 1000 // 6 horas

export async function fetchBlueRate(): Promise<number | null> {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/blue', {
      // cache corto para no golpear la API en cada render
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    const data = await res.json() as { venta?: number; compra?: number }
    const rate = Number(data.venta ?? data.compra)
    return Number.isFinite(rate) && rate > 0 ? rate : null
  } catch {
    return null
  }
}

/**
 * Si la cotización está en modo automático y el último update tiene más de
 * 6 horas, consulta dolarapi y la guarda en organization. Devuelve la org
 * (actualizada o no). Nunca lanza: ante cualquier problema devuelve la org tal cual.
 */
export async function ensureFreshDollarRate(org: Organization | null): Promise<Organization | null> {
  if (!org) return org
  // Migración aún no corrida → no hay columnas nuevas, no tocar nada.
  if (!('dollar_rate_source' in org)) return org
  if (org.dollar_rate_source === 'manual') return org

  const updatedAt = org.dollar_rate_updated_at ? new Date(org.dollar_rate_updated_at).getTime() : 0
  if (Date.now() - updatedAt < STALE_MS) return org

  const rate = await fetchBlueRate()
  if (!rate) return org

  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('organization')
      .update({ dollar_rate: rate, dollar_rate_updated_at: new Date().toISOString(), dollar_rate_source: 'auto' })
      .eq('id', org.id)
      .select()
      .single()
    return (data as Organization) ?? { ...org, dollar_rate: rate, dollar_rate_updated_at: new Date().toISOString() }
  } catch (err) {
    console.error('[dollar] update failed:', err)
    return org
  }
}
