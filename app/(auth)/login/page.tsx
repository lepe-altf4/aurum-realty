'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetOpen, setResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetMsg, setResetMsg] = useState('')
  const [resetSending, setResetSending] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setResetSending(true)
    setResetMsg('')
    try {
      await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim().toLowerCase() }),
      })
    } catch { /* anti-enumeración: respondemos igual */ }
    setResetSending(false)
    setResetMsg('Si el email está registrado, te enviamos un link para restablecer la contraseña. Si no llega, pedíselo al administrador.')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/leads')
      router.refresh()
    }
  }

  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '40px 44px',
      width: 400,
      boxShadow: 'var(--shadow-md)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: 'var(--ink)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--gold)', fontFamily: 'var(--font-jakarta)', fontWeight: 800, fontSize: 18,
          marginBottom: 16,
        }}>A</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Aurum Realty</h1>
        <p style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 4 }}>CRM Inmobiliario · Iniciá sesión</p>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Email</label>
          <input
            type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="tu@aurum.com.ar"
            style={{
              padding: '9px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
              fontSize: 14, outline: 'none', background: 'var(--surface)',
              fontFamily: 'inherit', color: 'var(--ink)',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Contraseña</label>
          <input
            type="password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              padding: '9px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
              fontSize: 14, outline: 'none', background: 'var(--surface)',
              fontFamily: 'inherit', color: 'var(--ink)',
            }}
          />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, margin: 0 }}>{error}</p>}
        <button
          type="submit" disabled={loading}
          style={{
            marginTop: 6, padding: '10px 16px', borderRadius: 'var(--radius)',
            background: 'var(--accent)', color: '#fff', fontWeight: 600,
            fontSize: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1, fontFamily: 'inherit',
          }}
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>

        {!resetOpen ? (
          <button
            type="button"
            onClick={() => { setResetOpen(true); setResetEmail(email) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 12.5, marginTop: 2, textDecoration: 'underline', textUnderlineOffset: 2 }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        ) : resetMsg ? (
          <p style={{ fontSize: 12.5, color: 'var(--success)', marginTop: 4, lineHeight: 1.5 }}>{resetMsg}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4, padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Email para restablecer</label>
            <input
              type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
              placeholder="tu@email.com"
              style={{ padding: '9px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: 14, outline: 'none', background: '#fff', fontFamily: 'inherit', color: 'var(--ink)' }}
            />
            <button
              type="button" onClick={handleReset} disabled={resetSending || !resetEmail.trim()}
              style={{ padding: '9px 12px', borderRadius: 'var(--radius)', background: 'var(--ink)', color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: resetSending ? 'wait' : 'pointer', opacity: resetSending || !resetEmail.trim() ? 0.6 : 1 }}
            >
              {resetSending ? 'Enviando…' : 'Enviar link de recuperación'}
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--ink-4)', marginTop: 4 }}>
          El acceso es solo por invitación. Pedísela al administrador.
        </p>
      </form>
    </div>
  )
}
