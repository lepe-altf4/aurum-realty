'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Lead, PipelineStage, Agent } from '@/lib/types'

const ORIGINS = ['WhatsApp', 'Instagram', 'ZonaProp', 'Argenprop', 'Web', 'Referido'] as const

export default function NewLeadModal({ stages, agents, defaultStageId, onClose, onCreated }: {
  stages: PipelineStage[]
  agents: Agent[]
  defaultStageId?: string
  onClose: () => void
  onCreated: (lead: Lead) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [origin, setOrigin] = useState('')
  const [operation, setOperation] = useState<'Venta' | 'Alquiler'>('Venta')
  const [stageId, setStageId] = useState(defaultStageId || stages[0]?.id || '')
  const [agentId, setAgentId] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'USD' | 'ARS'>('USD')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('leads')
      .insert({
        name: name.trim(),
        phone: phone || null,
        email: email || null,
        origin: origin || null,
        operation,
        stage_id: stageId || null,
        agent_id: agentId || null,
        amount: amount ? Number(amount) : null,
        currency,
        notes: notes || null,
        hot: false,
        score: 50,
        days_without_contact: 0,
      })
      .select('*, property:properties(*), stage:pipeline_stages(*), agent:agents(*)')
      .single()

    if (err) { setError(err.message); setLoading(false); return }
    if (data) onCreated(data as Lead)
    onClose()
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 'var(--radius)',
    border: '1px solid var(--border)', fontSize: 14, fontFamily: 'inherit',
    color: 'var(--ink)', background: '#fff', outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5, display: 'block',
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(36,25,17,0.4)', backdropFilter: 'blur(3px)', zIndex: 80 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 520, maxHeight: '90vh', background: '#fff', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(36,25,17,.22)', zIndex: 90,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>LEADS · NUEVO</div>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-jakarta)', marginTop: 3 }}>Registrar consulta</h2>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff', color: 'var(--ink-2)', cursor: 'pointer' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>Nombre *</label>
              <input required value={name} onChange={e => setName(e.target.value.slice(0, 200))} maxLength={200} placeholder="Nombre completo del lead" style={inp} autoFocus />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Teléfono</label>
                <input value={phone} onChange={e => setPhone(e.target.value.replace(/[^\d+\s()\-]/g, '').slice(0, 25))} maxLength={25} placeholder="+549 11..." style={inp} />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@ejemplo.com" style={inp} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Origen</label>
                <select value={origin} onChange={e => setOrigin(e.target.value)} style={{ ...inp, appearance: 'none', cursor: 'pointer' }}>
                  <option value="">Sin especificar</option>
                  {ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Operación</label>
                <select value={operation} onChange={e => setOperation(e.target.value as 'Venta' | 'Alquiler')} style={{ ...inp, appearance: 'none', cursor: 'pointer' }}>
                  <option value="Venta">Venta</option>
                  <option value="Alquiler">Alquiler</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Etapa inicial</label>
                <select value={stageId} onChange={e => setStageId(e.target.value)} style={{ ...inp, appearance: 'none', cursor: 'pointer' }}>
                  {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Agente asignado</label>
                <select value={agentId} onChange={e => setAgentId(e.target.value)} style={{ ...inp, appearance: 'none', cursor: 'pointer' }}>
                  <option value="">Sin asignar</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Monto estimado</label>
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" min="0" style={inp} />
              </div>
              <div>
                <label style={lbl}>Moneda</label>
                <select value={currency} onChange={e => setCurrency(e.target.value as 'USD' | 'ARS')} style={{ ...inp, appearance: 'none', cursor: 'pointer' }}>
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                </select>
              </div>
            </div>

            <div>
              <label style={lbl}>Notas iniciales</label>
              <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value.slice(0, 500))} maxLength={500} placeholder="Contexto, propiedad de interés, observaciones..." style={{ ...inp, resize: 'none', lineHeight: 1.5 }} />
            </div>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius)', background: '#FBE8E5', color: 'var(--danger)', fontSize: 13, border: '1px solid #E9CDC9' }}>
                Error: {error}
              </div>
            )}
          </div>

          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', background: '#fff' }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading || !name.trim()} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '9px 20px', borderRadius: 'var(--radius)', border: 'none',
              background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: loading || !name.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !name.trim() ? 0.65 : 1,
            }}>
              {loading ? 'Guardando...' : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                  Crear lead
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
