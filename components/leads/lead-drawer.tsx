'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SourceTag, StageTag, OpTag, Tag } from '@/components/ui/tags'
import { fmtUSD, fmtARS } from '@/lib/format'
import type { Lead, PipelineStage, Activity } from '@/lib/types'

export default function LeadDrawer({ lead, stages, onClose, onMove, onUpdate }: {
  lead: Lead
  stages: PipelineStage[]
  onClose: () => void
  onMove: (lead: Lead) => void
  onUpdate: (lead: Lead) => void
}) {
  const [note, setNote] = useState('')
  const [activities, setActivities] = useState<Activity[]>([])
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()
  const stageIdx = stages.findIndex(s => s.id === lead.stage_id)

  useEffect(() => {
    supabase
      .from('activities')
      .select('*, agent:agents(*)')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => data && setActivities(data))
  }, [lead.id])

  async function registerNote() {
    const text = note.trim()
    if (!text || submitting) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: agent } = user ? await supabase.from('agents').select('*').eq('auth_user_id', user.id).single() : { data: null }
    const { data: newActivity } = await supabase
      .from('activities')
      .insert({ lead_id: lead.id, agent_id: agent?.id ?? null, type: 'Nota', description: text })
      .select('*, agent:agents(*)')
      .single()
    if (newActivity) setActivities(prev => [newActivity, ...prev])
    setNote('')
    setSubmitting(false)
  }

  const activityIcon: Record<string, string> = {
    Nota: '📝', Llamada: '📞', Email: '✉️', WhatsApp: '💬', Visita: '🏠', Cambio_etapa: '→',
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(36,25,17,0.32)', backdropFilter: 'blur(2px)', zIndex: 60 }} />
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'var(--drawer-w)',
        background: '#fff', borderLeft: '1px solid var(--border)', zIndex: 70,
        display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)',
        animation: 'slideIn .22s cubic-bezier(.2,.7,.2,1)',
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(20px); opacity:0 } to { transform:none; opacity:1 } }`}</style>

        {/* Header */}
        <div style={{ padding: '16px 22px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>LEAD · {lead.id.slice(0,8).toUpperCase()}</div>
            <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', width: 32, height: 32, cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink-2)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>{lead.name}</h2>
            {lead.hot && <Tag variant="gold" >HOT</Tag>}
            <StageTag stage={lead.stage} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, fontSize: 12, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>
              {lead.phone}
            </span>
            <span style={{ color: lead.days_without_contact > 5 ? 'var(--danger)' : 'var(--ink-3)' }}>
              · {lead.days_without_contact}d sin contacto
            </span>
          </div>

          {/* Primary actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/\D/g,'')}`)}
              style={{ flex: 1, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 13, border: 'none', background: 'var(--success)', color: '#fff', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 1 1-3.4-6.5L20 4l-1.5 3.6A8 8 0 0 1 20 12z"/><path d="M8.5 9.5c.4 2.5 2.5 4.6 5 5l1.5-1.5-2-1-1 .7c-.8-.4-1.6-1.2-2-2l.7-1-1-2z"/></svg>
              Contactar por WhatsApp
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 13, border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>
              Llamar
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '18px 22px 22px' }}>

          {/* Contact info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { label: 'Email', value: lead.email || '—' },
              { label: 'Origen', custom: lead.origin && <SourceTag src={lead.origin} /> },
              { label: 'Operación', custom: lead.operation && <OpTag op={lead.operation} /> },
              { label: 'Agente', value: lead.agent?.name || '—' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{f.label}</div>
                {f.custom ? <div>{f.custom}</div> : <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>{f.value}</div>}
              </div>
            ))}
          </div>

          <hr style={{ height: 1, background: 'var(--border)', border: 0, margin: '16px 0' }} />

          {/* Property of interest */}
          {lead.property && (
            <>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 10 }}>Propiedad de interés</div>
              <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14, display: 'flex', gap: 14 }}>
                {lead.property.photo_url ? (
                  <img src={lead.property.photo_url} alt={lead.property.address} style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} loading="lazy" />
                ) : (
                  <div style={{ width: 96, height: 72, borderRadius: 6, background: 'var(--surface)', display: 'grid', placeItems: 'center', flexShrink: 0, border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 9, color: 'var(--ink-4)', fontFamily: 'var(--font-mono)' }}>No foto</span>
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{lead.property.address}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{lead.property.neighborhood} · {lead.property.type} · {lead.property.sqm} m² · {lead.property.rooms || '—'} amb.</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: lead.property.currency_listing === 'USD' ? 'var(--ink)' : 'var(--gold-soft)', color: lead.property.currency_listing === 'USD' ? '#fff' : '#6E5630', border: '1px solid transparent', fontVariantNumeric: 'tabular-nums' }}>
                      {lead.property.currency_listing === 'USD' ? fmtUSD(lead.property.price_usd ?? 0) : fmtARS(lead.property.price_ars ?? 0)}
                      {lead.property.operation === 'Alquiler' ? ' /mes' : ''}
                    </span>
                    {lead.property.premium && <Tag variant="gold">PREMIUM</Tag>}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Stage tracker */}
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '22px 0 10px' }}>Etapa actual</div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {stages.map((s, i) => (
                <div key={s.id} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= stageIdx ? 'var(--ink)' : 'var(--border)' }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{lead.stage?.name || '—'}</div>
              <button onClick={() => onMove(lead)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
                Mover etapa
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
            </div>
          </div>

          {/* Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Próxima acción</div>
              <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>
                {lead.next_action_date ? new Date(lead.next_action_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '—'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Score</div>
              <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                {lead.score} / 100
                {lead.hot && <Tag variant="gold">PREMIUM</Tag>}
              </div>
            </div>
          </div>

          <hr style={{ height: 1, background: 'var(--border)', border: 0, margin: '16px 0' }} />

          {/* Quick note */}
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 10 }}>Registrar actividad</div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 12 }}>
            <textarea
              rows={2} value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) registerNote() }}
              placeholder='Anotá la interacción: "Llamé, visita el jueves 14:30"'
              style={{ width: '100%', border: 0, outline: 0, resize: 'none', fontFamily: 'inherit', fontSize: 14, color: 'var(--ink)', background: 'transparent', padding: '2px 4px 6px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px dashed var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{lead.notes}</div>
              <button onClick={registerNote} disabled={!note.trim() || submitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600, border: 'none', background: 'var(--accent)', color: '#fff', cursor: note.trim() && !submitting ? 'pointer' : 'not-allowed', opacity: note.trim() && !submitting ? 1 : 0.45 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m4 12 5 5L20 7"/></svg>
                Registrar
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '1px 5px', border: '1px solid rgba(255,255,255,.2)', borderRadius: 3, opacity: 0.7 }}>⌘↵</span>
              </button>
            </div>
          </div>

          {/* Activity timeline */}
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '22px 0 14px' }}>Historial de actividades</div>
          <div style={{ position: 'relative', paddingLeft: 18 }}>
            <div style={{ position: 'absolute', left: 6, top: 4, bottom: 6, width: 1, background: 'var(--border)' }} />
            {activities.map((ev, i) => (
              <div key={ev.id} style={{ position: 'relative', paddingBottom: 14 }}>
                <div style={{
                  position: 'absolute', left: -18, top: 4, width: 9, height: 9,
                  borderRadius: '50%', background: i === 0 ? 'var(--gold)' : '#fff',
                  border: `2px solid ${i === 0 ? 'var(--gold)' : 'var(--ink-4)'}`,
                  boxShadow: i === 0 ? '0 0 0 4px var(--gold-soft)' : 'none',
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{ev.agent?.name || 'Sistema'}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{new Date(ev.created_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  {ev.type === 'Nota' && <span style={{ padding: '1px 6px', fontSize: 10, fontWeight: 600, background: 'var(--gold-soft)', color: '#6E5630', border: '1px solid #E2D4B5', borderRadius: 999 }}>NOTA</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 2 }}>
                  {activityIcon[ev.type] || ''} {ev.description}
                </div>
              </div>
            ))}
            {activities.length === 0 && <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Sin actividades registradas</div>}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <button style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 12px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>
            Agendar visita
          </button>
          <button style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 12px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5"/></svg>
            Generar boleto
          </button>
        </div>
      </aside>
    </>
  )
}
