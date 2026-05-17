import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export const runtime = 'nodejs'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const dbPassword = process.env.SUPABASE_DB_PASSWORD ?? ''

  if (!dbPassword) {
    return NextResponse.json({ ok: false, step: 'check_env', error: 'SUPABASE_DB_PASSWORD not set' })
  }

  // Extract project ref from URL: https://rekvmbrdcpgeizwrftuo.supabase.co
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '')

  // Try pooler first, then direct
  const connStrings = [
    `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`,
  ]

  let lastError = ''
  for (const connStr of connStrings) {
    const pool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
      max: 1,
    })
    try {
      const client = await pool.connect()
      try {
        await client.query(`
          GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
          GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
          GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
          GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
          ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
          ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
        `)
        const check = await client.query('SELECT count(*) as n FROM leads')
        return NextResponse.json({
          ok: true,
          message: 'Grants applied',
          leads_count: check.rows[0].n,
          conn: connStr.substring(0, 50) + '...',
        })
      } finally {
        client.release()
        await pool.end()
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
      await pool.end().catch(() => {})
    }
  }

  return NextResponse.json({ ok: false, step: 'connect', error: lastError, project_ref: projectRef })
}
