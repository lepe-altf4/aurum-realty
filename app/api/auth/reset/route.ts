import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, emailEnabled } from '@/lib/email'
import { resetEmailHtml } from '@/lib/email-templates'

export const dynamic = 'force-dynamic'

// Reset de contraseña con dos modos según quién llama:
//  - Público (login, sin sesión): SOLO envía el email de recuperación.
//    Nunca devuelve un link (sería toma de cuentas: cualquiera generaría el
//    link de cualquier email).
//  - Admin autenticado (Settings → Equipo): además devuelve un link copiable
//    para mandar por WhatsApp, porque el solicitante ya está verificado.
export async function POST(req: Request) {
  let body: { email?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Body inválido' }, { status: 400 }) }
  const email = (body.email ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  if (user) {
    const { data: caller } = await supabase.from('agents').select('role').eq('auth_user_id', user.id).single()
    isAdmin = caller?.role === 'Admin'
  }

  const origin = req.headers.get('origin') ?? new URL(req.url).origin
  const redirectTo = `${origin}/bienvenida`

  // ── Admin: generar link copiable (recovery) ──
  if (isAdmin) {
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo } })
    if (error) {
      return NextResponse.json({ error: `No se pudo generar el link: ${error.message}` }, { status: 500 })
    }
    return NextResponse.json({ reset_link: data.properties?.action_link ?? null })
  }

  // ── Público: enviar el link por email, nunca devolverlo (anti toma-de-cuentas) ──
  if (emailEnabled()) {
    // Generamos el link de recovery y lo mandamos nosotros por Resend.
    // generateLink solo arma el link para un usuario existente; si no existe,
    // no hacemos nada (y respondemos igual, anti-enumeración).
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo } })
    const link = data?.properties?.action_link
    if (!error && link) {
      const name = (data.user?.user_metadata?.name as string) ?? ''
      await sendEmail({ to: email, subject: 'Restablecé tu contraseña · CRM Unnique', html: resetEmailHtml({ name, link }) })
    }
  } else {
    // Sin proveedor propio: intento por el SMTP de Supabase (si está configurado).
    await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  }
  // Respuesta neutra siempre (no revela si el email existe).
  return NextResponse.json({ emailed: true })
}
