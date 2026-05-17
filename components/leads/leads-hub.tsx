'use client'
import { useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Topbar from '@/components/ui/topbar'
import { SourceTag, StageTag, OpTag, Tag } from '@/components/ui/tags'
import LeadDrawer from '@/components/leads/lead-drawer'
import type { Lead, PipelineStage, Agent } from '@/lib/types'

const ORIGINS = ['WhatsApp','Instagram','ZonaProp','Argenprop','Web','Referido']

function SummaryStat({ label, value, sub, color }: { label: string; value: string|number; sub: string; color?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>{label}</div>
      <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 24, marginTop: 6, letterSpacing: '-0.02em', color: color || 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

function IconBtn({ title, onClick, children, color }: { title: string; onClick?: (e: React.MouseEvent) => void; children: React.ReactNode; color?: string }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 32, height: 32, display: 'grid', placeItems: 'center',
      border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: '#fff',
      color: color || 'var(--ink-2)', cursor: 'pointer',
    }}>{children}</button>
  )
}

export default function LeadsHub({ initialLeads, stages, agents }: {
  initialLeads: Lead[]
  stages: PipelineStage[]
  agents: Agent[]
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [opFilter, setOpFilter] = useState<string>('Todas')
  const [originFilter, setOriginFilter] = useState<string>('Todos')
  const [stageFilter, setStageFilter] = useState<string>('Todas')
  const [openLead, setOpenLead] = useState<Lead | null>(null)

  const filtered = useMemo(() => leads.filter(l =>
    (opFilter === 'Todas' || l.operation === opFilter) &&
    (originFilter === 'Todos' || l.origin === originFilter) &&
    (stageFilter === 'Todas' || l.stage?.key === stageFilter)
  ), [leads, opFilter, originFilter, stageFilter])

  const stats = useMemo(() => ({
    active: leads.length,
    hot: leads.filter(l => l.hot).length,
    overdue: leads.filter(l => l.days_without_contact >= 5).length,
    noAction: leads.filter(l => l.days_without_contact >= 3).length,
  }), [leads])

  const handleMoveStage = useCallback(async (lead: Lead) => {
    const idx = stages.findIndex(s => s.id === lead.stage_id)
    const next = stages[Math.min(idx + 1, stages.length - 1)]
    if (!next || next.id === lead.stage_id) return
    const supabase = createClient()
    await supabase.from('leads').update({ stage_id: next.id }).eq('id', lead.id)
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, stage_id: next.id, stage: next } : l))
    if (openLead?.id === lead.id) setOpenLead(prev => prev ? { ...prev, stage_id: next.id, stage: next } : null)
  }, [stages, openLead])

  const handleLeadUpdate = useCallback((updated: Lead) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))
    setOpenLead(updated)
  }, [])

  return (
    <>
      <Topbar
        crumb="WORKSPACE · LEADS"
        title="Leads Hub"
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 13, border: '1px solid var(--border)', background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12m0 0-4-4m4 4 4-4M5 20h14"/></svg>
              Exportar
            </button>
            <button style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 'var(--radius)', fontWeight: 600, fontSize: 13, border: 'none', background: 'var(--accent)', color: '#fff', cursor: 'pointer' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
              Nuevo Lead
            </button>
          </div>
        }
      />

      <div style={{ padding: '24px 32px 48px' }}>
        {/* Summary strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 18 }}>
          <SummaryStat label="Leads activos"   value={stats.active}  sub="total en sistema" />
          <SummaryStat label="Nuevos hoy"      value={leads.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length} sub="ingresados hoy" />
          <SummaryStat label="Sin acción 72hs" value={stats.noAction} sub="requieren follow-up" color="var(--gold)" />
          <SummaryStat label="Atrasados"       value={stats.overdue}  sub="sin contacto +5d"    color="var(--danger)" />
          <SummaryStat label="Premium / HOT"   value={stats.hot}      sub={`ticket > USD 500k`}  color="var(--gold)" />
        </div>

        {/* Filters + Table */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          {/* Filter bar */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-3)' }}><path d="M3 5h18l-7 9v6l-4-2v-4z"/></svg>

            <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', fontWeight: 600 }}>Operación</span>
            {['Todas','Venta','Alquiler'].map(o => (
              <button key={o} onClick={() => setOpFilter(o)} style={{
                padding: '7px 11px', borderRadius: 8, border: '1px solid var(--border)',
                background: opFilter === o ? 'var(--ink)' : '#fff',
                color: opFilter === o ? '#fff' : 'var(--ink-2)',
                fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
              }}>{o}</button>
            ))}

            <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }} />

            <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', fontWeight: 600 }}>Origen</span>
            {['Todos', ...ORIGINS].map(o => (
              <button key={o} onClick={() => setOriginFilter(o)} style={{
                padding: '7px 11px', borderRadius: 8, border: '1px solid var(--border)',
                background: originFilter === o ? 'var(--ink)' : '#fff',
                color: originFilter === o ? '#fff' : 'var(--ink-2)',
                fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
              }}>{o}</button>
            ))}

            <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px' }} />

            <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', fontWeight: 600 }}>Etapa</span>
            <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} style={{
              padding: '7px 24px 7px 11px', borderRadius: 8, border: '1px solid var(--border)',
              background: stageFilter !== 'Todas' ? 'var(--ink)' : '#fff',
              color: stageFilter !== 'Todas' ? '#fff' : 'var(--ink-2)',
              fontSize: 12.5, fontWeight: 500, cursor: 'pointer', appearance: 'none', fontFamily: 'inherit',
            }}>
              <option value="Todas">Todas las etapas</option>
              {stages.map(s => <option key={s.id} value={s.key}>{s.name}</option>)}
            </select>

            <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-3)' }}>
              {filtered.length} de {leads.length} leads
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  {['', 'Nombre', 'Teléfono', 'Origen', 'Propiedad de interés', 'Operación', 'Etapa', 'Agente', 'Fecha', ''].map((h, i) => (
                    <th key={i} style={{
                      textAlign: i >= 8 ? 'right' : 'left',
                      fontSize: 10.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: 'var(--ink-3)', padding: '12px 14px', borderBottom: '1px solid var(--border)',
                      background: '#fff', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id} onClick={() => setOpenLead(lead)}
                    style={{ cursor: 'pointer', transition: 'background .1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FBFAF7')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', width: 30 }}
                      onClick={e => e.stopPropagation()}>
                      <input type="checkbox" />
                    </td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: lead.hot ? 'var(--gold)' : 'transparent',
                          border: lead.hot ? '0' : '1px solid var(--border)',
                        }} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--ink)' }}>
                            {lead.name}
                            {lead.hot && <span style={{ marginLeft: 6, padding: '1px 6px', fontSize: 10, fontWeight: 600, background: 'var(--gold-soft)', color: '#6E5630', border: '1px solid #E2D4B5', borderRadius: 999 }}>HOT</span>}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{lead.id.slice(0,8)}…</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', fontVariantNumeric: 'tabular-nums', fontSize: 13.5, color: 'var(--ink-2)' }}>{lead.phone}</td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                      {lead.origin && <SourceTag src={lead.origin} />}
                    </td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                      {lead.property && (
                        <>
                          <div style={{ fontWeight: 500, color: 'var(--ink)', fontSize: 13.5 }}>{lead.property.address}</div>
                          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{lead.property.neighborhood} · {lead.property.type}</div>
                        </>
                      )}
                    </td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                      {lead.operation && <OpTag op={lead.operation} />}
                    </td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                      <StageTag stage={lead.stage} />
                    </td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                      {lead.agent && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--surface-2)', color: 'var(--ink)', display: 'grid', placeItems: 'center', fontSize: 10.5, fontWeight: 600, border: '1px solid var(--border)' }}>
                            {lead.agent.initials}
                          </div>
                          <span style={{ fontSize: 13 }}>{lead.agent.name.split(' ')[0]}</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {new Date(lead.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      {' · '}
                      <span style={{ color: lead.days_without_contact > 5 ? 'var(--danger)' : 'var(--ink-3)' }}>
                        {lead.days_without_contact}d
                      </span>
                    </td>
                    <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}
                      onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <IconBtn title="WhatsApp" color="var(--success)"
                          onClick={() => window.open(`https://wa.me/${lead.phone?.replace(/\D/g,'')}`)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 1 1-3.4-6.5L20 4l-1.5 3.6A8 8 0 0 1 20 12z"/><path d="M8.5 9.5c.4 2.5 2.5 4.6 5 5l1.5-1.5-2-1-1 .7c-.8-.4-1.6-1.2-2-2l.7-1-1-2z"/></svg>
                        </IconBtn>
                        <IconBtn title="Mover etapa" onClick={() => handleMoveStage(lead)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                        </IconBtn>
                        <IconBtn title="Más">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
                      No hay leads que coincidan con los filtros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {openLead && (
        <LeadDrawer
          lead={openLead}
          stages={stages}
          onClose={() => setOpenLead(null)}
          onMove={handleMoveStage}
          onUpdate={handleLeadUpdate}
        />
      )}
    </>
  )
}
