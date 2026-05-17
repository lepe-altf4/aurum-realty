'use client'
import { useMemo } from 'react'
import Topbar from '@/components/ui/topbar'
import { Tag } from '@/components/ui/tags'
import type { Lead, PipelineStage, Agent } from '@/lib/types'
import { fmtUSD } from '@/lib/format'

// ── helpers ─────────────────────────────────────────────────────────────────
function Avatar({ initials, size = 32, color = 'var(--gold-soft)' }: { initials: string; size?: number; color?: string }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, color: 'var(--gold)', flexShrink: 0,
      fontFamily: 'var(--font-jakarta)',
    }}>
      {initials}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', overflow: 'hidden', ...style,
    }}>
      {children}
    </div>
  )
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '16px 20px', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      {children}
    </div>
  )
}

function IconBtn({ title, children, color, onClick }: { title: string; children: React.ReactNode; color?: string; onClick?: () => void }) {
  return (
    <button title={title} onClick={onClick} style={{
      width: 30, height: 30, display: 'grid', placeItems: 'center',
      border: '1px solid var(--border)', borderRadius: 6,
      background: '#fff', color: color || 'var(--ink-2)', cursor: 'pointer',
    }}>{children}</button>
  )
}

// ── hardcoded tasks ──────────────────────────────────────────────────────────
const TASKS = [
  { id: 1, name: 'Florencia Bianchi', action: 'Llamar por revisita', time: '09:00', overdue: true, phone: '+5491112345678' },
  { id: 2, name: 'Ramiro Achával', action: 'Enviar propuesta actualizada', time: '11:00', overdue: false, phone: '+5491187654321' },
  { id: 3, name: 'Damián Ortega', action: 'Confirmar turno escritura', time: '14:30', overdue: false, phone: '+5491156781234' },
  { id: 4, name: 'Martín Iraola', action: 'Seguimiento oferta pendiente', time: '16:00', overdue: true, phone: '+5491143217654' },
]

// ── hardcoded agent effectiveness ────────────────────────────────────────────
const EFFECTIVENESS = [
  { name: 'Lucía Fernández', initials: 'LF', pct: 22, respMin: 3 },
  { name: 'Martín Suárez', initials: 'MS', pct: 19, respMin: 5 },
  { name: 'Valentina Ríos', initials: 'VR', pct: 16, respMin: 8 },
  { name: 'Santiago Gómez', initials: 'SG', pct: 12, respMin: 12 },
  { name: 'Andrea Torres', initials: 'AT', pct: 9, respMin: 18 },
]

// ── stage avg days ────────────────────────────────────────────────────────────
const STAGE_AVG_DAYS: Record<string, number> = {
  consulta: 4,
  visita: 7,
  oferta: 12,
  reserva: 9,
  escritura: 18,
}

// ── main component ────────────────────────────────────────────────────────────
export default function SalesPanel({ leads, stages }: {
  leads: Lead[]
  stages: PipelineStage[]
  agents: Agent[]
}) {
  // KPI derivations
  const totalLeads = leads.length
  const overdue = useMemo(() => leads.filter(l => l.days_without_contact >= 5), [leads])
  const sin72 = useMemo(() => leads.filter(l => l.days_without_contact >= 3 && l.stage?.key !== 'escritura'), [leads])
  const closedLeads = useMemo(() => leads.filter(l => l.stage?.key === 'escritura'), [leads])
  const atRiskUSD = useMemo(() => overdue.reduce((s, l) => s + (l.amount || 0), 0), [overdue])

  // Stage counts
  const stageCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const s of stages) map[s.key] = 0
    for (const l of leads) {
      if (l.stage?.key) map[l.stage.key] = (map[l.stage.key] || 0) + 1
    }
    return map
  }, [leads, stages])

  // Bottleneck: stage with highest count × avgDays
  const bottleneckKey = useMemo(() => {
    let maxScore = 0
    let key = ''
    for (const s of stages) {
      const score = (stageCounts[s.key] || 0) * (STAGE_AVG_DAYS[s.key] || 1)
      if (score > maxScore) { maxScore = score; key = s.key }
    }
    return key
  }, [stages, stageCounts])

  // Top overdue leads
  const topOverdue = useMemo(() => overdue.slice(0, 5), [overdue])

  // Funnel: total count for conversion %
  const firstStageCount = stages[0] ? (stageCounts[stages[0].key] || 0) : 1
  const maxBarCount = Math.max(...stages.map(s => stageCounts[s.key] || 0), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title="Panel de Ventas" crumb="CRM" />

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', flex: 1 }}>

        {/* ── Red Alert Banner ── */}
        {overdue.length > 0 && (
          <div style={{
            background: 'linear-gradient(90deg, #FBE8E5 0%, var(--surface) 100%)',
            borderLeft: '3px solid var(--danger)',
            borderRadius: 'var(--radius)',
            padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: 20,
            border: '1px solid #E9CDC9',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/><path d="M12 17h.01"/>
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--danger)', fontFamily: 'var(--font-jakarta)' }}>
                Atención requerida
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 3 }}>
                <strong>{overdue.length}</strong> leads sin contacto ≥5 días &nbsp;·&nbsp;
                <strong>2</strong> tareas vencidas &nbsp;·&nbsp;
                <strong>{fmtUSD(atRiskUSD)}</strong> en riesgo
              </div>
            </div>
            <button style={{
              padding: '6px 14px', borderRadius: 6, border: '1px solid #E9CDC9',
              background: '#fff', color: 'var(--danger)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              Ver todos
            </button>
          </div>
        )}

        {/* ── 5 KPI cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
          {/* 1. Leads Activos */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Leads Activos</div>
            <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 30, marginTop: 8, letterSpacing: '-0.02em' }}>{totalLeads}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: 'var(--ink-3)' }}>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>▲ +12%</span>
              <span>vs. semana pasada</span>
            </div>
          </div>

          {/* 2. Por Etapa — mini bar chart */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Por Etapa</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, marginTop: 12, height: 40 }}>
              {stages.map(s => {
                const count = stageCounts[s.key] || 0
                const h = maxBarCount > 0 ? Math.max(4, (count / maxBarCount) * 38) : 4
                const isBottleneck = s.key === bottleneckKey
                return (
                  <div key={s.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{
                      width: '100%', height: h,
                      background: isBottleneck ? 'var(--danger)' : 'var(--gold)',
                      borderRadius: 3, opacity: isBottleneck ? 1 : 0.6,
                    }} />
                    <span style={{ fontSize: 9, color: 'var(--ink-3)' }}>{count}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
              Cuello: <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{stages.find(s => s.key === bottleneckKey)?.name || '—'}</span>
            </div>
          </div>

          {/* 3. Atrasados */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>⚠ Atrasados</div>
            <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 30, marginTop: 8, letterSpacing: '-0.02em', color: overdue.length > 0 ? 'var(--danger)' : 'var(--ink)' }}>{overdue.length}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>Sin contacto ≥5 días</div>
          </div>

          {/* 4. Sin Acción 72hs */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Sin Acción 72hs</div>
            <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 30, marginTop: 8, letterSpacing: '-0.02em', color: sin72.length > 0 ? '#7A4A1F' : 'var(--ink)' }}>{sin72.length}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>Excluye escritura</div>
          </div>

          {/* 5. Cierres mes */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Cierres mes</div>
            <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 30, marginTop: 8, letterSpacing: '-0.02em', color: 'var(--success)' }}>{closedLeads.length}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 8 }}>En etapa escritura</div>
          </div>
        </div>

        {/* ── Row 2: Tareas + Efectividad ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          {/* Tareas de hoy */}
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Tareas de hoy</h3>
              <Tag variant="default">{TASKS.length}</Tag>
            </CardHeader>
            <div>
              {TASKS.map(task => (
                <div key={task.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 20px', borderBottom: '1px solid var(--border)',
                }}>
                  <input type="checkbox" style={{ width: 16, height: 16, accentColor: 'var(--gold)', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{task.name}</span>
                      {task.overdue && <Tag variant="danger">Vencida</Tag>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{task.action}</div>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--ink-4)', flexShrink: 0 }}>{task.time}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <IconBtn title="WhatsApp" color="var(--success)">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </IconBtn>
                    <IconBtn title="Llamar">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.44 2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </IconBtn>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Efectividad del equipo */}
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Efectividad del equipo</h3>
            </CardHeader>
            <div style={{ padding: '8px 0' }}>
              {EFFECTIVENESS.map(agent => {
                const respColor = agent.respMin <= 5 ? 'var(--success)' : agent.respMin <= 15 ? 'var(--ink-2)' : 'var(--danger)'
                return (
                  <div key={agent.name} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Avatar initials={agent.initials} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{agent.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{agent.pct}%</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(agent.pct / 25) * 100}%`, background: 'var(--gold)', borderRadius: 2 }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: respColor, fontWeight: 600, flexShrink: 0, minWidth: 48, textAlign: 'right' }}>
                      {agent.respMin} min
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* ── Row 3: Funnel + Atrasados ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          {/* Embudo */}
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Embudo · días promedio por etapa</h3>
            </CardHeader>
            <div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 2fr 60px 70px 70px',
                padding: '8px 20px', fontSize: 11, color: 'var(--ink-3)',
                fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                borderBottom: '1px solid var(--border)',
              }}>
                <span>Etapa</span>
                <span>Distribución</span>
                <span style={{ textAlign: 'right' }}>Leads</span>
                <span style={{ textAlign: 'right' }}>Conv %</span>
                <span style={{ textAlign: 'right' }}>Días prom</span>
              </div>
              {stages.map((s, i) => {
                const count = stageCounts[s.key] || 0
                const convPct = firstStageCount > 0 ? Math.round((count / firstStageCount) * 100) : 0
                const avgDays = STAGE_AVG_DAYS[s.key] || 5
                const barW = maxBarCount > 0 ? Math.max(4, (count / maxBarCount) * 100) : 4
                const isBottleneck = s.key === bottleneckKey
                return (
                  <div key={s.id} style={{
                    display: 'grid', gridTemplateColumns: '1fr 2fr 60px 70px 70px',
                    padding: '11px 20px', alignItems: 'center',
                    borderBottom: i < stages.length - 1 ? '1px solid var(--border)' : undefined,
                    background: isBottleneck ? 'var(--danger-soft)' : 'transparent',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isBottleneck && (
                        <span style={{ fontSize: 10 }}>⚠</span>
                      )}
                      <span style={{ fontSize: 13, fontWeight: isBottleneck ? 700 : 500, color: isBottleneck ? 'var(--danger)' : 'var(--ink)' }}>
                        {s.name}
                      </span>
                    </div>
                    <div style={{ paddingRight: 12 }}>
                      <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${barW}%`,
                          background: isBottleneck ? 'var(--danger)' : 'var(--gold)',
                          borderRadius: 3, opacity: isBottleneck ? 1 : 0.7,
                        }} />
                      </div>
                    </div>
                    <div className="num" style={{ textAlign: 'right', fontWeight: 600, fontSize: 13 }}>{count}</div>
                    <div className="num" style={{ textAlign: 'right', fontSize: 12, color: 'var(--ink-3)' }}>{convPct}%</div>
                    <div className="num" style={{ textAlign: 'right', fontWeight: 600, fontSize: 13, color: isBottleneck ? 'var(--danger)' : 'var(--ink)' }}>{avgDays}d</div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Atrasados · contactar YA */}
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Atrasados · contactar YA</h3>
              <Tag variant="danger">{overdue.length}</Tag>
            </CardHeader>
            <div style={{ padding: '8px 0' }}>
              {topOverdue.length === 0 ? (
                <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                  No hay leads atrasados
                </div>
              ) : topOverdue.map(lead => (
                <div key={lead.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 20px', borderBottom: '1px solid var(--border)',
                }}>
                  <Avatar initials={lead.agent?.initials || lead.agent?.name?.slice(0, 2).toUpperCase() || '?'} size={30} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.name}</span>
                      {lead.hot && <Tag variant="danger">HOT</Tag>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.property?.address || 'Sin propiedad'}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="num" style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)' }}>
                      {lead.days_without_contact}d
                    </span>
                    <IconBtn title="WhatsApp" color="var(--success)">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </IconBtn>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
