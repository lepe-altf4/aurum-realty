import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

async function testPostgrest(url: string, key: string) {
  try {
    const res = await fetch(`${url}/rest/v1/leads?select=id&limit=1`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    })
    const body = await res.text()
    return { status: res.status, body: body.substring(0, 200) }
  } catch (e) {
    return { status: 0, error: e instanceof Error ? e.message : String(e) }
  }
}

function decodeJwtPayload(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8')
    return JSON.parse(payload)
  } catch { return null }
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  const jwtPayload = serviceKey ? decodeJwtPayload(serviceKey) : null

  const result = await testPostgrest(url, serviceKey)

  return NextResponse.json({
    key_present: !!serviceKey,
    key_prefix: serviceKey ? serviceKey.substring(0, 30) : 'MISSING',
    key_starts_with: serviceKey ? serviceKey.substring(0, 4) : 'N/A',
    jwt_role: jwtPayload?.role ?? 'UNKNOWN',
    jwt_iss: jwtPayload?.iss ?? 'UNKNOWN',
    postgrest_test: result,
  })
}
