'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Topbar from '@/components/ui/topbar'
import { SourceTag, OpTag, Tag } from '@/components/ui/tags'
import type { Lead, LeadClaim, Agent } from '@/lib/types'

function SummaryStat({ label, value, sub, color }: { label: string; value: string | number; sub: string; color?: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>{label}</div>
      <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 24, marginTop: 6, letterSpacing: '-0.02em', color: color || 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

export default function PoolView({ initialLeads, initialClaims, viewer, isAdmin }: {
  initialLeads: Lead[]
  initialClaims: LeadClaim[]
  viewer: Agent | null
  isAdmin: boolean
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [claims, setClaims] = useState<LeadClaim[]>(initialClaims)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const poolLeads = useMemo(() => leads.filter(l => l.status_asignacion === 'pool'), [leads])
  const pendingLeads = useMemo(() => leads.filter(l => l.status_asignacion === 'pendiente_aprobacion'), [leads])
  const myClaimLeadIds = useMemo(
    () => new Set(claims.filter(c => c.agente_id === viewer?.id && c.estado === 'pendiente').map(c => c.lead_id)),
    [claims, viewer]
  )

  async function handleClaim(lead: Lead) {
    if (!viewer) return
    setBusyId(lead.id)
    setError(null)
    const supabase = createClient()
    const { data, error: err } = await supabase.rpc('claim_lead', { p_lead_id: lead.id })
    setBusyId(null)
    if (err) {
      setError(err.message.replace(/^.*?:\s*/, ''))
      return
    }
    const claimId = (data as { claim_id?: string })?.claim_id ?? crypto.randomUUID()
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status_asignacion: 'pendiente_aprobacion' } : l))
    setClaims(prev => [...prev, {
      id: claimId, lead_id: lead.id, agente_id: viewer.id, estado: 'pendiente',
      created_at: new Date().toISOString(), resolved_at: null, resolved_by: null,
      lead, agente: viewer,
    }])
  }

  async function handleResolve(claim: LeadClaim, approve: boolean) {
    setBusyId(claim.id)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.rpc('resolve_claim', { p_claim_id: claim.id, p_approve: approve })
    setBusyId(null)
    if (err) {
      setError(err.message.replace(/^.*?:\s*/, ''))
      return
    }
    if (approve) {
      // El lead deja el pozo; los demás reclamos de ese lead quedan rechazados
      setLeads(prev => prev.filter(l => l.id !== claim.lead_id))
      setClaims(prev => prev.filter(c => c.lead_id !== claim.lead_id))
    } else {
      setClaims(prev => prev.filter(c => c.id !== claim.id))
      const stillPending = claims.some(c => c.lead_id === claim.lead_id && c.id !== claim.id && c.estado === 'pendiente')
      if (!stillPending) {
        setLeads(prev => prev.map(l => l.id === claim.lead_id ? { ...l, status_asignacion: 'pool' } : l))
      }
    }
  }

  const pendingClaims = claims.filter(c => c.estado === 'pendiente')

  return (
    <>
      <Topbar crumb="WORKSPACE · LEADS" title="Pozo de Leads" search={false} />

      <div className="page-pad" style={{ padding: '24px 32px 48px' }}>

        <div className="stat-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
          <SummaryStat label="En el pozo" value={poolLeads.length} sub="sin dueño · disponibles" />
          <SummaryStat label="Esperando aprobación" value={pendingLeads.length} sub="reclamados, sin resolver" color="var(--gold)" />
          <SummaryStat label="Reclamos pendientes" value={pendingClaims.length} sub={isAdmin ? 'requieren tu decisión' : 'tuyos y de otros agentes'} color={pendingClaims.length > 0 ? 'var(--danger)' : undefined} />
        </div>

        {error && (
          <div style={{ marginBottom: 16, padding: '10px 16px', borderRadius: 'var(--radius)', background: '#FBE8E5', border: '1px solid #E9CDC9', color: 'var(--danger)', fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* ── Admin: reclamos pendientes ── */}
        {isAdmin && (
          <div style={{ marginBottom: 20, background: '#fff', border: '1px solid #E2D4B5', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--gold-soft)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6E5630" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z"/><path d="M12 8v4l2.5 2.5"/></svg>
              <div style={{ fontWeight: 700, fontSize: 13, color: '#6E5630' }}>Reclamos pendientes · {pendingClaims.length}</div>
            </div>
            {pendingClaims.length === 0 ? (
              <div style={{ padding: '22px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                No hay reclamos esperando aprobación
              </div>
            ) : pendingClaims.map((claim, i) => (
              <div key={claim.id} className="claim-row" style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', flexWrap: 'wrap',
                borderBottom: i < pendingClaims.length - 1 ? '1px solid var(--border)' : undefined,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--ink)', border: '1px solid var(--border)', flexShrink: 0 }}>
                  {claim.agente?.initials || claim.agente?.name?.slice(0, 2).toUpperCase() || '??'}
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 13.5 }}>
                    <strong>{claim.agente?.name ?? 'Agente'}</strong>
                    <span style={{ color: 'var(--ink-3)' }}> reclama a </span>
                    <strong>{claim.lead?.name ?? 'Lead'}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                    {claim.lead?.property?.address ? `${claim.lead.property.address} · ` : ''}
                    {new Date(claim.created_at).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => handleResolve(claim, true)}
                    disabled={busyId === claim.id}
                    style={{ padding: '8px 16px', borderRadius: 'var(--radius)', border: 'none', background: 'var(--success)', color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', opacity: busyId === claim.id ? 0.6 : 1 }}>
                    ✓ Aprobar
                  </button>
                  <button
                    onClick={() => handleResolve(claim, false)}
                    disabled={busyId === claim.id}
                    style={{ padding: '8px 16px', borderRadius: 'var(--radius)', border: '1px solid #E9CDC9', background: '#fff', color: 'var(--danger)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', opacity: busyId === claim.id ? 0.6 : 1 }}>
                    Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabla del pozo ── */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-3)', fontWeight: 600 }}>
              Leads sin dueño
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-3)' }}>{leads.length} leads</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  {['Nombre', 'Origen', 'Propiedad de interés', 'Operación', 'Ingresó', 'Estado', ''].map((h, i) => (
                    <th key={i} style={{
                      textAlign: i >= 6 ? 'right' : 'left',
                      fontSize: 10.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: 'var(--ink-3)', padding: '12px 14px', borderBottom: '1px solid var(--border)',
                      background: '#fff', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => {
                  const isPending = lead.status_asignacion === 'pendiente_aprobacion'
                  const claimedByMe = myClaimLeadIds.has(lead.id)
                  return (
                    <tr key={lead.id} style={{ background: isPending ? 'var(--surface)' : 'transparent' }}>
                      <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{lead.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{lead.phone || lead.email || '—'}</div>
                      </td>
                      <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                        {lead.origin && <SourceTag src={lead.origin} />}
                      </td>
                      <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                        {lead.property ? (
                          <>
                            <div style={{ fontWeight: 500, color: 'var(--ink)', fontSize: 13.5 }}>{lead.property.address}</div>
                            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{lead.property.neighborhood} · {lead.property.type}</div>
                          </>
                        ) : <span style={{ color: 'var(--ink-4)', fontSize: 13 }}>—</span>}
                      </td>
                      <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                        {lead.operation && <OpTag op={lead.operation} />}
                      </td>
                      <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                        {new Date(lead.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      </td>
                      <td style={{ padding: '14px', borderBottom: '1px solid var(--border)' }}>
                        {isPending
                          ? <Tag variant="gold" dot>{claimedByMe ? 'Reclamado por vos' : 'En revisión'}</Tag>
                          : <Tag variant="default" dot>En el pozo</Tag>}
                      </td>
                      <td style={{ padding: '14px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                        {!isPending && (
                          <button
                            onClick={() => handleClaim(lead)}
                            disabled={busyId === lead.id || !viewer}
                            style={{
                              padding: '8px 16px', borderRadius: 'var(--radius)', border: 'none',
                              background: 'var(--accent)', color: '#fff', fontSize: 12.5, fontWeight: 600,
                              cursor: 'pointer', opacity: busyId === lead.id ? 0.6 : 1, whiteSpace: 'nowrap',
                            }}>
                            {busyId === lead.id ? 'Reclamando…' : 'Reclamar'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
                      El pozo está vacío — todos los leads tienen dueño
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
