import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8')
    return JSON.parse(payload)
  } catch {
    return null
  }
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  // Decode JWT to see which project it belongs to
  const jwtPayload = serviceKey ? decodeJwtPayload(serviceKey) : null
  const jwtIssuer = jwtPayload?.iss as string | undefined
  // Expected issuer looks like: https://rekvmbrdcpgeizwrftuo.supabase.co/auth/v1
  const projectFromUrl = url.replace('https://', '').replace('.supabase.co', '')
  const projectFromJwt = jwtIssuer ? jwtIssuer.replace('https://', '').replace('.supabase.co/auth/v1', '') : 'UNKNOWN'

  const projectMatch = projectFromUrl === projectFromJwt

  // Try a real DB query
  let dbResult: Record<string, unknown> = {}
  try {
    const admin = createAdminClient()
    const { error, count, status } = await admin
      .from('leads')
      .select('id', { count: 'exact', head: true })

    if (error) {
      dbResult = {
        ok: false,
        status,
        error_message: error.message || '(empty)',
        error_code: error.code,
      }
    } else {
      dbResult = { ok: true, leads_count: count ?? 0 }
    }
  } catch (e) {
    dbResult = { ok: false, thrown: e instanceof Error ? e.message : String(e) }
  }

  return NextResponse.json({
    url_project: projectFromUrl,
    jwt_project: projectFromJwt,
    projects_match: projectMatch,
    jwt_role: jwtPayload?.role ?? 'UNKNOWN',
    db: dbResult,
  })
}
