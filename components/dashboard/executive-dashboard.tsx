'use client'
import { useState, useMemo, useEffect, useRef } from 'react'
import Topbar from '@/components/ui/topbar'
import { compactNum, fmtUSD, fmtARS } from '@/lib/format'
import type { Lead, Agent } from '@/lib/types'

// ── helpers ─────────────────────────────────────────────────────────────────
function Avatar({ initials, size = 32 }: { initials: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--gold-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center',
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

// ── hardcoded 9-month data ────────────────────────────────────────────────────
const MONTHS = ['Sep', 'Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May']
const BAR_DATA = [180000, 210000, 195000, 240000, 220000, 270000, 290000, 310000, 285000]

// ── origin donut data ─────────────────────────────────────────────────────────
const ORIGIN_COLORS: Record<string, string> = {
  WhatsApp: 'var(--success)',
  Instagram: 'var(--gold)',
  ZonaProp: 'var(--ink)',
  Argenprop: 'var(--ink-3)',
  Web: '#B3925A',
  Referido: '#8E7560',
}
const ORIGIN_LABELS = ['WhatsApp', 'Instagram', 'ZonaProp', 'Argenprop', 'Web', 'Referido']

// ── donut chart via SVG ───────────────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; count: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (total === 0) return <div style={{ textAlign: 'center', color: 'var(--ink-3)', padding: 24 }}>Sin datos</div>

  const r = 52
  const cx = 70
  const cy = 70
  const circumference = 2 * Math.PI * r
  let offset = 0

  const segments = data.map(d => {
    const pct = d.count / total
    const dash = pct * circumference
    const seg = { ...d, dash, offset, pct }
    offset += dash
    return seg
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={140} height={140} viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
        {segments.map((seg, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={22}
            strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
            strokeDashoffset={-seg.offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" style={{ fontSize: 18, fontWeight: 700, fill: 'var(--ink)', fontFamily: 'var(--font-jakarta)' }}>{total}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 10, fill: 'var(--ink-3)' }}>leads</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--ink-2)', flex: 1 }}>{seg.label}</span>
            <span className="num" style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{seg.count}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)', minWidth: 34, textAlign: 'right' }}>
              {Math.round(seg.pct * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── bar chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, labels, currency, dollarRate }: { data: number[]; labels: string[]; currency: 'USD' | 'ARS'; dollarRate: number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t) }, [])
  const max = Math.max(...data)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 140, paddingTop: 8 }}>
      {data.map((val, i) => {
        const pct = max > 0 ? (val / max) * 100 : 0
        const isLast = i === data.length - 1
        const fmt = currency === 'USD' ? `USD ${compactNum(val)}` : `ARS ${compactNum(val * dollarRate)}`
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 9, color: isLast ? 'var(--gold)' : 'var(--ink-3)', fontWeight: isLast ? 700 : 400 }}>
              {fmt}
            </div>
            <div style={{ width: '100%', height: 100, display: 'flex', alignItems: 'flex-end' }}>
              <div style={{
                width: '100%',
                height: mounted ? `${pct}%` : '0%',
                background: isLast ? 'var(--gold)' : 'var(--gold-soft)',
                borderRadius: '4px 4px 0 0',
                border: isLast ? '1px solid var(--gold)' : '1px solid var(--border)',
                transition: 'height 0.7s cubic-bezier(0.34,1.56,0.64,1)',
                transitionDelay: `${i * 0.05}s`,
              }} />
            </div>
            <div style={{ fontSize: 10, color: isLast ? 'var(--gold)' : 'var(--ink-3)', fontWeight: isLast ? 700 : 400 }}>
              {labels[i]}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────
export default function ExecutiveDashboard({ leads, agents, dollarRate, activeProperties }: {
  leads: Lead[]
  agents: Agent[]
  dollarRate: number
  activeProperties: number
}) {
  const [currency, setCurrency] = useState<'USD' | 'ARS'>('USD')

  // KPI derivations
  const closed = useMemo(() => leads.filter(l => l.stage?.key === 'escritura'), [leads])
  const totalAmountUSD = useMemo(() => leads.reduce((s, l) => {
    if (!l.amount) return s
    return s + (l.currency === 'USD' ? l.amount : l.amount / dollarRate)
  }, 0), [leads, dollarRate])

  const closedAmountUSD = useMemo(() => closed.reduce((s, l) => {
    if (!l.amount) return s
    return s + (l.currency === 'USD' ? l.amount : l.amount / dollarRate)
  }, 0), [closed, dollarRate])

  const newLeads = useMemo(() => leads.filter(l => l.stage?.key === 'consulta').length, [leads])
  const closureRate = leads.length - newLeads > 0 ? ((closed.length / (leads.length - newLeads)) * 100).toFixed(1) : '0.0'
  const avgTicketUSD = closed.length > 0 ? closedAmountUSD / closed.length : 0

  // Pipeline display value
  const pipelineDisplay = currency === 'USD'
    ? `USD ${compactNum(totalAmountUSD)}`
    : `ARS ${compactNum(totalAmountUSD * dollarRate)}`
  const pipelineSub = currency === 'USD'
    ? `≈ ARS ${compactNum(totalAmountUSD * dollarRate)}`
    : `≈ USD ${compactNum(totalAmountUSD)}`

  // Closed display
  const closedDisplay = currency === 'USD'
    ? `USD ${compactNum(closedAmountUSD)}`
    : `ARS ${compactNum(closedAmountUSD * dollarRate)}`

  // Ticket display
  const ticketDisplay = currency === 'USD'
    ? fmtUSD(avgTicketUSD)
    : fmtARS(avgTicketUSD * dollarRate)

  // Origin breakdown
  const originCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const label of ORIGIN_LABELS) map[label] = 0
    for (const l of leads) {
      if (l.origin && map[l.origin] !== undefined) map[l.origin]++
    }
    return map
  }, [leads])
  const originData = ORIGIN_LABELS.map(label => ({
    label, count: originCounts[label] || 0, color: ORIGIN_COLORS[label],
  }))

  // Agent ranking
  const agentStats = useMemo(() => {
    return agents.map(agent => {
      const agentLeads = leads.filter(l => l.agent_id === agent.id)
      const agentClosed = agentLeads.filter(l => l.stage?.key === 'escritura')
      const closedUSD = agentClosed.reduce((s, l) => {
        if (!l.amount) return s
        return s + (l.currency === 'USD' ? l.amount : l.amount / dollarRate)
      }, 0)
      const rate = agentLeads.length > 0 ? ((agentClosed.length / agentLeads.length) * 100).toFixed(0) : '0'
      const commission = closedUSD * (agent.commission_pct / 100)
      return { agent, total: agentLeads.length, closed: agentClosed.length, rate, commission, closedUSD }
    }).sort((a, b) => b.closed - a.closed)
  }, [agents, leads, dollarRate])

  const currencyToggle = (
    <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', height: 34 }}>
      {(['USD', 'ARS'] as const).map(c => (
        <button key={c} onClick={() => setCurrency(c)} style={{
          padding: '0 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 0,
          background: currency === c ? 'var(--ink)' : '#fff',
          color: currency === c ? '#fff' : 'var(--ink-3)',
          transition: 'background 0.2s',
        }}>{c}</button>
      ))}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title="Dashboard Ejecutivo" crumb="CRM" right={currencyToggle} />

      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', flex: 1 }}>

        {/* ── 5 KPI Hero Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14 }}>
          {/* Pipeline Total */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Pipeline Total</div>
            <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 26, marginTop: 8, letterSpacing: '-0.02em' }}>{pipelineDisplay}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>{pipelineSub}</div>
          </div>

          {/* Cierres este mes */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Cierres este mes</div>
            <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 30, marginTop: 8, letterSpacing: '-0.02em', color: 'var(--success)' }}>{closed.length}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>{closedDisplay}</div>
          </div>

          {/* Tasa de cierre */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Tasa de cierre</div>
            <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 30, marginTop: 8, letterSpacing: '-0.02em' }}>{closureRate}%</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>Excluye nuevas consultas</div>
          </div>

          {/* Ticket promedio */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Ticket promedio</div>
            <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 22, marginTop: 8, letterSpacing: '-0.02em' }}>{ticketDisplay}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>Sobre cierres</div>
          </div>

          {/* Propiedades activas */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Propiedades activas</div>
            <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 30, marginTop: 8, letterSpacing: '-0.02em' }}>{activeProperties}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>En cartera disponible</div>
          </div>
        </div>

        {/* ── Row 2: Bar chart + Donut ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Ingresos por mes · últimos 9 meses</h3>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>en {currency}</span>
            </CardHeader>
            <div style={{ padding: '20px 20px 16px' }}>
              <BarChart data={BAR_DATA} labels={MONTHS} currency={currency} dollarRate={dollarRate} />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Distribución por origen</h3>
            </CardHeader>
            <div style={{ padding: 20 }}>
              <DonutChart data={originData} />
            </div>
          </Card>
        </div>

        {/* ── Agent ranking table ── */}
        <Card>
          <CardHeader>
            <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Ranking del equipo</h3>
          </CardHeader>
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 120px 100px 100px 140px',
              padding: '8px 20px', fontSize: 11, color: 'var(--ink-3)',
              fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
              borderBottom: '1px solid var(--border)',
            }}>
              <span>#</span>
              <span>Agente</span>
              <span style={{ textAlign: 'right' }}>Leads asignados</span>
              <span style={{ textAlign: 'right' }}>Tasa cierre</span>
              <span style={{ textAlign: 'right' }}>Cierres</span>
              <span style={{ textAlign: 'right' }}>Comisión estimada</span>
            </div>
            {agentStats.map((row, i) => {
              const commDisplay = currency === 'USD'
                ? fmtUSD(row.commission)
                : fmtARS(row.commission * dollarRate)
              return (
                <div key={row.agent.id} style={{
                  display: 'grid', gridTemplateColumns: '40px 1fr 120px 100px 100px 140px',
                  padding: '12px 20px', alignItems: 'center',
                  borderBottom: i < agentStats.length - 1 ? '1px solid var(--border)' : undefined,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {i === 0 ? (
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>1</div>
                    ) : (
                      <span style={{ fontSize: 13, color: 'var(--ink-3)', fontWeight: 600 }}>{i + 1}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar initials={row.agent.initials || row.agent.name.slice(0, 2).toUpperCase()} size={32} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{row.agent.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{row.agent.role}</div>
                    </div>
                  </div>
                  <div className="num" style={{ textAlign: 'right', fontWeight: 600, fontSize: 13 }}>{row.total}</div>
                  <div className="num" style={{ textAlign: 'right', fontSize: 13, color: 'var(--ink-2)' }}>{row.rate}%</div>
                  <div className="num" style={{ textAlign: 'right', fontWeight: 600, fontSize: 13, color: 'var(--success)' }}>{row.closed}</div>
                  <div className="num" style={{ textAlign: 'right', fontWeight: 700, fontSize: 13, color: 'var(--gold)' }}>{commDisplay}</div>
                </div>
              )
            })}
            {agentStats.length === 0 && (
              <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>Sin agentes</div>
            )}
          </div>
        </Card>

      </div>
    </div>
  )
}
