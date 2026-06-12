'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SourceTag, StageTag, OpTag, Tag } from '@/components/ui/tags'
import { fmtUSD, fmtARS } from '@/lib/format'
import type { Lead, PipelineStage, Activity, Property } from '@/lib/types'

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
  const [showStageMenu, setShowStageMenu] = useState(false)
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('10:00')
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [propertySearch, setPropertySearch] = useState('')
  const [propertyResults, setPropertyResults] = useState<Property[]>([])
  const [showPropertySearch, setShowPropertySearch] = useState(false)
  const [searchingProperty, setSearchingProperty] = useState(false)
  const supabase = createClient()
  const stageIdx = stages.findIndex(s => s.id === lead.stage_id)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    if (newActivity) {
      setActivities(prev => [newActivity, ...prev])
      // El trigger en la base ya reseteó el contador; reflejarlo al instante
      onUpdate({ ...lead, days_without_contact: 0, last_contact_at: newActivity.created_at })
    }
    setNote('')
    setSubmitting(false)
  }

  async function moveToStage(stage: PipelineStage) {
    setShowStageMenu(false)
    if (stage.id === lead.stage_id) return
    await supabase.from('leads').update({ stage_id: stage.id }).eq('id', lead.id)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: agent } = user ? await supabase.from('agents').select('id').eq('auth_user_id', user.id).single() : { data: null }
    if (agent) {
      await supabase.from('activities').insert({
        lead_id: lead.id, agent_id: agent.id,
        type: 'Cambio_etapa', description: `Lead movido a etapa ${stage.name}`,
      })
    }
    const updated = { ...lead, stage_id: stage.id, stage, days_without_contact: 0, last_contact_at: new Date().toISOString() }
    onUpdate(updated)
  }

  async function saveSchedule() {
    if (!scheduleDate) return
    setSavingSchedule(true)
    const dateTime = scheduleTime ? `${scheduleDate}T${scheduleTime}:00` : scheduleDate
    await supabase.from('leads').update({ next_action_date: dateTime }).eq('id', lead.id)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: agent } = user ? await supabase.from('agents').select('id').eq('auth_user_id', user.id).single() : { data: null }
    if (agent) {
      await supabase.from('activities').insert({
        lead_id: lead.id, agent_id: agent.id,
        type: 'Visita', description: `Visita agendada para ${new Date(dateTime).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })} ${scheduleTime}`,
      })
    }
    const updated = { ...lead, next_action_date: dateTime, days_without_contact: 0, last_contact_at: new Date().toISOString() }
    onUpdate(updated)
    setShowSchedule(false)
    setSavingSchedule(false)
    setScheduleDate('')
    setScheduleTime('10:00')
  }

  function searchProperties(q: string) {
    setPropertySearch(q)
    if (searchRef.current) clearTimeout(searchRef.current)
    if (!q.trim()) { setPropertyResults([]); return }
    setSearchingProperty(true)
    searchRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, address, neighborhood, type, price_usd, price_ars, currency_listing, operation, sqm, rooms, status, premium, photo_url, description, created_at')
        .ilike('address', `%${q}%`)
        .in('status', ['Disponible', 'Reservada'])
        .limit(6)
      setPropertyResults((data || []) as Property[])
      setSearchingProperty(false)
    }, 300)
  }

  async function assignProperty(property: Property) {
    await supabase.from('leads').update({ property_id: property.id }).eq('id', lead.id)
    const updated = { ...lead, property_id: property.id, property }
    onUpdate(updated)
    setShowPropertySearch(false)
    setPropertySearch('')
    setPropertyResults([])
  }

  function generateBoleto() {
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Boleto de Reserva · ${lead.name}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, serif; color: #241911; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 2px solid #B3925A; margin-bottom: 28px; }
  .brand { font-size: 22px; font-weight: 700; letter-spacing: 0.04em; }
  .brand-sub { font-size: 11px; color: #7A6A5B; letter-spacing: 0.18em; text-transform: uppercase; margin-top: 2px; }
  .doc-id { text-align: right; }
  .doc-id .label { font-size: 10px; color: #7A6A5B; text-transform: uppercase; letter-spacing: 0.12em; }
  .doc-id .value { font-size: 13px; font-weight: 600; font-family: monospace; margin-top: 2px; }
  h1 { font-size: 18px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 28px; color: #241911; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 0.14em; color: #7A6A5B; font-family: Arial, sans-serif; font-weight: 600; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #EAE5DC; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .field { margin-bottom: 12px; }
  .field-label { font-size: 10px; color: #7A6A5B; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 3px; font-family: Arial, sans-serif; }
  .field-value { font-size: 13px; font-weight: 500; color: #241911; }
  .amount-box { padding: 16px 20px; background: #F8F6F2; border: 1px solid #EAE5DC; border-radius: 8px; margin-top: 12px; }
  .amount-label { font-size: 10px; color: #7A6A5B; text-transform: uppercase; letter-spacing: 0.14em; font-family: Arial; }
  .amount-value { font-size: 28px; font-weight: 700; color: #241911; margin-top: 4px; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px; margin-top: 60px; }
  .sig-line { border-top: 1px solid #241911; padding-top: 8px; text-align: center; font-size: 10px; color: #7A6A5B; text-transform: uppercase; letter-spacing: 0.1em; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #EAE5DC; font-size: 9px; color: #A8998A; text-align: center; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="brand">AURUM</div>
    <div class="brand-sub">Realty CRM</div>
  </div>
  <div class="doc-id">
    <div class="label">Nº de Boleto</div>
    <div class="value">BOL-${lead.id.slice(0, 8).toUpperCase()}</div>
    <div class="label" style="margin-top:6px">Fecha</div>
    <div class="value" style="font-family:inherit;font-size:12px">${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
  </div>
</div>

<h1>Boleto de Reserva</h1>

<div class="section">
  <div class="section-title">Datos del comprador / locatario</div>
  <div class="grid-2">
    <div class="field"><div class="field-label">Nombre completo</div><div class="field-value">${lead.name}</div></div>
    <div class="field"><div class="field-label">Teléfono</div><div class="field-value">${lead.phone || '—'}</div></div>
    <div class="field"><div class="field-label">Email</div><div class="field-value">${lead.email || '—'}</div></div>
    <div class="field"><div class="field-label">Operación</div><div class="field-value">${lead.operation || '—'}</div></div>
  </div>
</div>

${lead.property ? `
<div class="section">
  <div class="section-title">Propiedad</div>
  <div class="grid-2">
    <div class="field"><div class="field-label">Dirección</div><div class="field-value">${lead.property.address}</div></div>
    <div class="field"><div class="field-label">Barrio</div><div class="field-value">${lead.property.neighborhood || '—'}</div></div>
    <div class="field"><div class="field-label">Tipo</div><div class="field-value">${lead.property.type}</div></div>
    <div class="field"><div class="field-label">Superficie</div><div class="field-value">${lead.property.sqm ? lead.property.sqm + ' m²' : '—'}</div></div>
  </div>
</div>
` : ''}

<div class="section">
  <div class="section-title">Condiciones económicas</div>
  ${lead.amount ? `
  <div class="amount-box">
    <div class="amount-label">Monto de seña / primer pago</div>
    <div class="amount-value">${lead.currency === 'USD' ? 'USD ' + lead.amount.toLocaleString('es-AR') : '$ ' + lead.amount.toLocaleString('es-AR')}</div>
  </div>
  ` : '<p style="color:#7A6A5B;font-size:12px;margin-top:8px">Monto a confirmar</p>'}
</div>

<div class="section">
  <div class="section-title">Agente responsable</div>
  <div class="field"><div class="field-value">${lead.agent?.name || '—'}</div></div>
</div>

<div class="signatures">
  <div class="sig-line">Firma del Comprador</div>
  <div class="sig-line">Firma del Vendedor</div>
  <div class="sig-line">Firma del Agente Inmobiliario</div>
</div>

<div class="footer">
  Documento generado por Aurum Realty CRM · ${new Date().toLocaleString('es-AR')} · Para uso interno y legal conforme legislación vigente.
</div>
</body>
</html>`

    const w = window.open('', '_blank', 'width=794,height=1123')
    if (!w) { alert('Habilitá las ventanas emergentes para generar el boleto'); return }
    w.document.write(html)
    w.document.close()
    w.focus()
    setTimeout(() => w.print(), 500)
  }

  const activityIcon: Record<string, string> = {
    Nota: '📝', Llamada: '📞', Email: '✉️', WhatsApp: '💬', Visita: '🏠', Cambio_etapa: '→',
  }

  const scoreColor = lead.score >= 70 ? 'var(--success)' : lead.score >= 40 ? 'var(--gold)' : 'var(--danger)'

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
            <div style={{ fontSize: 12, color: 'var(--ink-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>LEAD · {lead.id.slice(0, 8).toUpperCase()}</div>
            <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', width: 32, height: 32, cursor: 'pointer', display: 'grid', placeItems: 'center', color: 'var(--ink-2)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>{lead.name}</h2>
            {lead.hot && <Tag variant="gold">HOT</Tag>}
            <StageTag stage={lead.stage} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4, fontSize: 12, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
              {lead.phone}
            </span>
            <span style={{ color: lead.days_without_contact > 5 ? 'var(--danger)' : 'var(--ink-3)' }}>
              · {lead.days_without_contact}d sin contacto
            </span>
          </div>

          {/* Primary actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button
              onClick={() => lead.phone && window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`)}
              style={{ flex: 1, justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 13, border: 'none', background: 'var(--success)', color: '#fff', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 1 1-3.4-6.5L20 4l-1.5 3.6A8 8 0 0 1 20 12z" /><path d="M8.5 9.5c.4 2.5 2.5 4.6 5 5l1.5-1.5-2-1-1 .7c-.8-.4-1.6-1.2-2-2l.7-1-1-2z" /></svg>
              Contactar por WhatsApp
            </button>
            <button
              onClick={() => lead.phone && window.open(`tel:${lead.phone.replace(/\D/g, '')}`)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 13, border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
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
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Propiedad de interés</div>
              <button
                onClick={() => setShowPropertySearch(s => !s)}
                style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>
                {lead.property ? 'Cambiar' : '+ Asignar'}
              </button>
            </div>

            {showPropertySearch && (
              <div style={{ marginBottom: 10, border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                <input
                  autoFocus
                  value={propertySearch}
                  onChange={e => searchProperties(e.target.value)}
                  placeholder="Buscar propiedad por dirección..."
                  style={{ width: '100%', padding: '9px 14px', border: 0, borderBottom: '1px solid var(--border)', outline: 'none', fontSize: 13, fontFamily: 'inherit', color: 'var(--ink)' }}
                />
                <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                  {searchingProperty && <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--ink-3)' }}>Buscando...</div>}
                  {!searchingProperty && propertyResults.length === 0 && propertySearch.length > 0 && (
                    <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--ink-3)' }}>Sin resultados para "{propertySearch}"</div>
                  )}
                  {!searchingProperty && propertySearch.length === 0 && (
                    <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--ink-3)' }}>Escribí una dirección para buscar</div>
                  )}
                  {propertyResults.map(p => (
                    <div
                      key={p.id}
                      onClick={() => assignProperty(p)}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: '#fff', transition: 'background .1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--surface)'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#fff'}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{p.address}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{p.neighborhood} · {p.type}{p.sqm ? ` · ${p.sqm} m²` : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lead.property ? (
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
            ) : (
              <div style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '16px', textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
                Sin propiedad asignada
              </div>
            )}
          </div>

          {/* Stage tracker */}
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', margin: '22px 0 10px' }}>Etapa actual</div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {stages.map((s, i) => (
                <div key={s.id} title={s.name} style={{ flex: 1, height: 5, borderRadius: 3, background: i <= stageIdx ? 'var(--ink)' : 'var(--border)', cursor: 'pointer', transition: 'background .15s' }}
                  onClick={() => moveToStage(s)} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showStageMenu ? 12 : 0 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                {lead.stage?.name || '—'}
                {stageIdx < stages.length - 1 && !showStageMenu && (
                  <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--ink-4)' }}>→ {stages[stageIdx + 1]?.name}</span>
                )}
              </div>
              <button
                onClick={() => setShowStageMenu(s => !s)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600, border: '1px solid var(--border)', background: showStageMenu ? 'var(--ink)' : '#fff', color: showStageMenu ? '#fff' : 'var(--ink)', cursor: 'pointer', transition: 'all .12s' }}>
                {showStageMenu ? 'Cancelar' : 'Mover etapa'}
                {!showStageMenu && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>}
              </button>
            </div>
            {/* Inline stage picker — no absolute positioning, no overflow clipping */}
            {showStageMenu && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {stages.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => moveToStage(s)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${s.id === lead.stage_id ? 'var(--gold)' : 'var(--border)'}`,
                      background: s.id === lead.stage_id ? 'var(--gold-soft)' : '#fff',
                      color: s.id === lead.stage_id ? '#6E5630' : 'var(--ink)',
                      fontSize: 13, fontWeight: s.id === lead.stage_id ? 700 : 500,
                      cursor: s.id === lead.stage_id ? 'default' : 'pointer',
                      textAlign: 'left', transition: 'all .1s',
                    }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: i <= stageIdx ? 'var(--ink)' : 'var(--border)', flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                      {s.id === lead.stage_id && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m4 12 5 5L20 7" /></svg>}
                    </div>
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Meta */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Próxima acción</div>
              <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500 }}>
                {lead.next_action_date
                  ? new Date(lead.next_action_date).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Score</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${lead.score}%`, background: scoreColor, borderRadius: 3, transition: 'width .4s ease' }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: scoreColor, fontVariantNumeric: 'tabular-nums', minWidth: 28 }}>{lead.score}</span>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m4 12 5 5L20 7" /></svg>
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
                  {ev.type === 'Visita' && <span style={{ padding: '1px 6px', fontSize: 10, fontWeight: 600, background: '#E8F5E9', color: '#1E4620', border: '1px solid #A5D6A7', borderRadius: 999 }}>VISITA</span>}
                  {ev.type === 'Cambio_etapa' && <span style={{ padding: '1px 6px', fontSize: 10, fontWeight: 600, background: 'var(--surface-2)', color: 'var(--ink-2)', border: '1px solid var(--border)', borderRadius: 999 }}>ETAPA</span>}
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
          <button onClick={() => setShowSchedule(true)} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 12px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /></svg>
            Agendar visita
          </button>
          <button onClick={generateBoleto} style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '9px 12px', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h8l5 5v13H6z" /><path d="M14 3v5h5" /></svg>
            Generar boleto
          </button>
        </div>
      </aside>

      {/* Schedule visit modal */}
      {showSchedule && (
        <>
          <div onClick={() => setShowSchedule(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(36,25,17,0.4)', backdropFilter: 'blur(2px)', zIndex: 80 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 380, background: '#fff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(36,25,17,.22)', zIndex: 90, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10.5, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>VISITA</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>Agendar visita con {lead.name.split(' ')[0]}</div>
              </div>
              <button onClick={() => setShowSchedule(false)} style={{ width: 30, height: 30, display: 'grid', placeItems: 'center', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>Fecha</div>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', color: 'var(--ink)', outline: 'none' }}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 6 }}>Hora</div>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', color: 'var(--ink)', outline: 'none' }}
                />
              </div>
              {lead.property && (
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--ink-2)' }}>
                  📍 {lead.property.address}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button onClick={() => setShowSchedule(false)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--ink)' }}>
                  Cancelar
                </button>
                <button
                  onClick={saveSchedule}
                  disabled={!scheduleDate || savingSchedule}
                  style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius)', border: 'none', background: 'var(--ink)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: scheduleDate ? 'pointer' : 'not-allowed', opacity: scheduleDate ? 1 : 0.5 }}>
                  {savingSchedule ? 'Guardando…' : 'Confirmar visita'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
