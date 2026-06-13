import 'server-only'

// Envío de email transaccional vía Resend (https://resend.com).
// Se activa con la env var RESEND_API_KEY. Sin ella, emailEnabled() = false y
// los flujos caen al link compartible (sin error).
//
// Env vars:
//   RESEND_API_KEY  → API key de Resend (obligatoria para enviar)
//   EMAIL_FROM      → remitente, ej: "Unnique CRM <equipo@tudominio.com>"
//                     (debe ser un dominio verificado en Resend; para pruebas
//                      Resend permite "onboarding@resend.dev" solo al dueño de la cuenta)

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export function emailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY
}

export async function sendEmail(opts: { to: string; subject: string; html: string }): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY
  if (!key) return { ok: false, error: 'RESEND_API_KEY no configurada' }
  const from = process.env.EMAIL_FROM || 'Unnique CRM <onboarding@resend.dev>'

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('[email] Resend error', res.status, body.slice(0, 300))
      return { ok: false, error: `Resend ${res.status}` }
    }
    return { ok: true }
  } catch (e) {
    console.error('[email] fetch failed', e)
    return { ok: false, error: (e as Error).message }
  }
}
