'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } },
    })
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
      background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
      padding: '40px 44px', width: 400, boxShadow: 'var(--shadow-md)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: 'var(--ink)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--gold)', fontFamily: 'var(--font-jakarta)', fontWeight: 800, fontSize: 18, marginBottom: 16,
        }}>A</div>
        <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Crear cuenta</h1>
        <p style={{ color: 'var(--ink-3)', fontSize: 13, marginTop: 4 }}>Aurum Realty CRM</p>
      </div>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { label: 'Nombre completo', value: name, setter: setName, type: 'text', placeholder: 'Juan Pérez' },
          { label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'tu@aurum.com.ar' },
          { label: 'Contraseña', value: password, setter: setPassword, type: 'password', placeholder: '••••••••' },
        ].map(f => (
          <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{f.label}</label>
            <input
              type={f.type} required value={f.value}
              onChange={e => f.setter(e.target.value)}
              placeholder={f.placeholder}
              style={{
                padding: '9px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                fontSize: 14, outline: 'none', background: 'var(--surface)', fontFamily: 'inherit', color: 'var(--ink)',
              }}
            />
          </div>
        ))}
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
          {loading ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
          ¿Ya tenés cuenta?{' '}
          <a href="/login" style={{ color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>Iniciá sesión</a>
        </p>
      </form>
    </div>
  )
}
