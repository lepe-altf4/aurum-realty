'use client'
import { useState, useMemo } from 'react'
import Topbar from '@/components/ui/topbar'
import { compactNum, fmtUSD, fmtARS, timeAgo } from '@/lib/format'
import type { Lead, Agent, PipelineStage } from '@/lib/types'

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

// ── PDF export ────────────────────────────────────────────────────────────────
const MONTH_NAMES_ES_FULL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function exportPDF(params: {
  leads: Lead[]
  agents: Agent[]
  dollarRate: number
  currency: 'USD' | 'ARS'
  closureRate: string
  closed: Lead[]
  totalAmountUSD: number
  avgTicketUSD: number
  activeProperties: number
  period: 'monthly' | 'annual'
  month?: number
  year?: number
}) {
  const { leads, agents, dollarRate, currency, closureRate, closed, totalAmountUSD, avgTicketUSD, activeProperties, period, month, year } = params
  const fmt = (usd: number) => currency === 'USD'
    ? `USD ${usd.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : `ARS ${(usd * dollarRate).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  const now = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

  // Filter leads by selected month/year for monthly reports
  const reportLeads = (period === 'monthly' && month !== undefined && year !== undefined)
    ? leads.filter(l => {
        const d = new Date(l.created_at)
        return d.getMonth() === month && d.getFullYear() === year
      })
    : leads
  const reportClosed = (period === 'monthly' && month !== undefined && year !== undefined)
    ? closed.filter(l => {
        const d = new Date(l.created_at)
        return d.getMonth() === month && d.getFullYear() === year
      })
    : closed
  const periodLabel = period === 'monthly' && month !== undefined && year !== undefined
    ? `${MONTH_NAMES_ES_FULL[month]} ${year}`
    : year ? `Año ${year}` : 'Período actual'

  const reportTotalUSD = reportLeads.reduce((s, l) => {
    if (!l.amount) return s
    return s + (l.currency === 'USD' ? l.amount : l.amount / dollarRate)
  }, 0)
  const reportAvgTicket = reportClosed.length > 0
    ? reportClosed.reduce((s, l) => s + (l.currency === 'USD' ? (l.amount || 0) : (l.amount || 0) / dollarRate), 0) / reportClosed.length
    : 0
  const reportRate = reportLeads.length > 0 ? ((reportClosed.length / reportLeads.length) * 100).toFixed(1) : '0.0'

  const agentRows = agents.map((agent, i) => {
    const agentLeads = reportLeads.filter(l => l.agent_id === agent.id)
    const agentClosed = agentLeads.filter(l => l.stage?.key === 'escritura')
    const closedUSD = agentClosed.reduce((s, l) => s + (l.currency === 'USD' ? (l.amount || 0) : (l.amount || 0) / dollarRate), 0)
    const rate = agentLeads.length > 0 ? ((agentClosed.length / agentLeads.length) * 100).toFixed(0) : '0'
    const commission = closedUSD * (agent.commission_pct / 100)
    return `<tr><td>${i + 1}</td><td><strong>${agent.name}</strong></td><td>${agent.role}</td><td>${agentLeads.length}</td><td>${agentClosed.length}</td><td>${rate}%</td><td style="color:#B3925A;font-weight:700">${fmt(commission)}</td></tr>`
  }).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Aurum Realty · ${periodLabel}</title><style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;color:#241911;padding:40px;background:#fff;font-size:13px;line-height:1.5}
    .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #B3925A}
    .logo{font-size:22px;font-weight:800;letter-spacing:-0.02em}.logo span{color:#B3925A}
    .subtitle{font-size:12px;color:#7A6A5B;margin-top:4px}
    .kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:28px}
    .kpi{background:#F8F6F2;border:1px solid #EAE5DC;border-radius:10px;padding:16px}
    .kpi-label{font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:#7A6A5B;font-weight:600}
    .kpi-value{font-size:20px;font-weight:700;margin-top:6px;color:#241911}
    h2{font-size:11px;font-weight:700;margin-bottom:12px;color:#241911;text-transform:uppercase;letter-spacing:.1em;padding-bottom:8px;border-bottom:1px solid #EAE5DC}
    .section{margin-bottom:28px}
    table{width:100%;border-collapse:collapse}
    th{text-align:left;padding:8px 12px;border-bottom:2px solid #EAE5DC;font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:#7A6A5B}
    td{padding:10px 12px;border-bottom:1px solid #EAE5DC;font-size:12px}
    .footer{margin-top:40px;padding-top:16px;border-top:1px solid #EAE5DC;font-size:11px;color:#7A6A5B;display:flex;justify-content:space-between}
    @page{size:A4;margin:20mm}
    @media print{body{padding:0}}
  </style></head><body>
    <div class="header">
      <div><div class="logo">AURUM <span>REALTY</span></div><div class="subtitle">Resumen ${period === 'monthly' ? 'mensual' : 'anual'} · ${periodLabel} · Exportado ${now}</div></div>
      <div style="text-align:right;font-size:11px;color:#7A6A5B"><div>Leads período: <strong>${reportLeads.length}</strong></div><div>Propiedades activas: <strong>${activeProperties}</strong></div></div>
    </div>
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">Pipeline del período</div><div class="kpi-value">${fmt(reportTotalUSD)}</div></div>
      <div class="kpi"><div class="kpi-label">Cierres del período</div><div class="kpi-value" style="color:#1E4620">${reportClosed.length}</div></div>
      <div class="kpi"><div class="kpi-label">Tasa de cierre</div><div class="kpi-value">${reportRate}%</div></div>
      <div class="kpi"><div class="kpi-label">Ticket promedio</div><div class="kpi-value" style="font-size:15px">${fmt(reportAvgTicket)}</div></div>
      <div class="kpi"><div class="kpi-label">Propiedades activas</div><div class="kpi-value">${activeProperties}</div></div>
    </div>
    <div class="section">
      <h2>Ranking del equipo · ${periodLabel}</h2>
      <table><thead><tr><th>#</th><th>Agente</th><th>Rol</th><th>Leads asignados</th><th>Cierres</th><th>Tasa cierre</th><th>Comisión estimada</th></tr></thead>
      <tbody>${agentRows}</tbody></table>
    </div>
    <div class="footer"><span>Aurum Realty CRM · Generado automáticamente</span><span>${now}</span></div>
  </body></html>`

  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) { alert('Permití ventanas emergentes para exportar el PDF'); return }
  w.document.write(html)
  w.document.close()
  setTimeout(() => { w.focus(); w.print() }, 500)
}

// ── period selector modal ─────────────────────────────────────────────────────
const MONTH_NAMES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function PeriodModal({ onSelect, onClose }: {
  onSelect: (p: 'monthly' | 'annual', month?: number, year?: number) => void
  onClose: () => void
}) {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() - i)

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(36,25,17,0.3)', backdropFilter: 'blur(2px)', zIndex: 80 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 380, background: '#fff', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(36,25,17,.22)', zIndex: 90, overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>EXPORTAR PDF</div>
          <h2 style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-jakarta)', marginTop: 3 }}>Seleccionar período</h2>
        </div>
        <div style={{ padding: '16px 22px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Month/year picker */}
          <div style={{ padding: '14px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Resumen mensual</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 4 }}>Mes</div>
                <select
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
                  {MONTH_NAMES_ES.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', marginBottom: 4 }}>Año</div>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: 'var(--ink)', cursor: 'pointer' }}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={() => { onSelect('monthly', selectedMonth, selectedYear); onClose() }}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius)', border: 'none', background: 'var(--ink)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Exportar {MONTH_NAMES_ES[selectedMonth]} {selectedYear}
            </button>
          </div>

          <button
            onClick={() => { onSelect('annual', undefined, selectedYear); onClose() }}
            style={{ padding: '14px 18px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>Resumen anual {selectedYear}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>Consolidado del año con ranking acumulado</div>
          </button>

          <button onClick={onClose} style={{ padding: '9px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontSize: 13, color: 'var(--ink-3)', fontWeight: 500 }}>Cancelar</button>
        </div>
      </div>
    </>
  )
}

// ── main component ────────────────────────────────────────────────────────────
export default function ExecutiveDashboard({ leads, agents, stages = [], dollarRate, dollarUpdatedAt = null, dollarSource = 'manual', activeProperties }: {
  leads: Lead[]
  agents: Agent[]
  stages?: PipelineStage[]
  dollarRate: number
  dollarUpdatedAt?: string | null
  dollarSource?: 'auto' | 'manual'
  activeProperties: number
}) {
  const [currency, setCurrency] = useState<'USD' | 'ARS'>('USD')
  const [showPeriodModal, setShowPeriodModal] = useState(false)

  // KPI derivations
  const closed = useMemo(() => leads.filter(l => l.stage?.key === 'escritura'), [leads])

  // Fecha de cierre real (closed_at); fallback a updated_at si la migración 009 no corrió
  const closeDate = (l: Lead) => new Date(l.closed_at ?? l.updated_at)

  // Cierres del mes actual (escrituras cerradas este mes, por closed_at real)
  const closedThisMonth = useMemo(() => {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    return closed.filter(l => closeDate(l) >= monthStart)
  }, [closed])

  // Cierres recientes: escrituras ordenadas por fecha de cierre real.
  const recentClosures = useMemo(() => {
    const agentName = (l: Lead) => {
      const id = l.owner_id ?? l.agent_id
      return agents.find(a => a.id === id)?.name ?? null
    }
    return [...closed]
      .sort((a, b) => closeDate(b).getTime() - closeDate(a).getTime())
      .slice(0, 6)
      .map(l => ({
        id: l.id,
        address: l.property?.address ?? l.name,
        usd: l.amount ? (l.currency === 'USD' ? l.amount : l.amount / dollarRate) : 0,
        date: closeDate(l),
        agent: agentName(l),
      }))
  }, [closed, agents, dollarRate])
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

  const closedThisMonthUSD = useMemo(() => closedThisMonth.reduce((s, l) => {
    if (!l.amount) return s
    return s + (l.currency === 'USD' ? l.amount : l.amount / dollarRate)
  }, 0), [closedThisMonth, dollarRate])

  const closedDisplay = currency === 'USD'
    ? `USD ${compactNum(closedThisMonthUSD)}`
    : `ARS ${compactNum(closedThisMonthUSD * dollarRate)}`

  const ticketDisplay = currency === 'USD'
    ? fmtUSD(avgTicketUSD)
    : fmtARS(avgTicketUSD * dollarRate)

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

  // Embudo del negocio: por etapa, cantidad + valor $ (USD) + retención vs etapa previa.
  // Cuello de botella = la transición con menor retención (donde más se pierde).
  const funnel = useMemo(() => {
    const rows = stages.map(s => {
      const stl = leads.filter(l => l.stage?.key === s.key)
      const usd = stl.reduce((sum, l) => sum + (l.amount ? (l.currency === 'USD' ? l.amount : l.amount / dollarRate) : 0), 0)
      return { key: s.key, name: s.name, count: stl.length, usd }
    })
    let bnKey = ''; let minRet = Infinity
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1].count
      if (prev > 0) {
        const ret = rows[i].count / prev
        if (ret < minRet) { minRet = ret; bnKey = rows[i].key }
      }
    }
    const maxCount = Math.max(...rows.map(r => r.count), 1)
    return { rows, bnKey, maxCount }
  }, [stages, leads, dollarRate])

  // Canal por CIERRES (no solo por leads): qué origen genera más escrituras.
  const channels = useMemo(() => {
    const map: Record<string, { leads: number; closed: number }> = {}
    for (const label of ORIGIN_LABELS) map[label] = { leads: 0, closed: 0 }
    for (const l of leads) {
      if (l.origin && map[l.origin]) {
        map[l.origin].leads++
        if (l.stage?.key === 'escritura') map[l.origin].closed++
      }
    }
    const arr = ORIGIN_LABELS.map(label => ({ label, color: ORIGIN_COLORS[label], ...map[label] }))
    const top = [...arr].filter(a => a.closed > 0).sort((a, b) => b.closed - a.closed)[0] ?? null
    return { arr, top }
  }, [leads])

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

  const rightControls = (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      <div title={dollarSource === 'auto' ? 'Cotización automática (dólar blue · dolarapi.com)' : 'Cotización cargada manualmente'} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '7px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
        background: 'var(--surface)', fontSize: 12, color: 'var(--ink-2)',
      }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: dollarSource === 'auto' ? 'var(--success)' : 'var(--gold)', flexShrink: 0 }} />
        <span className="num" style={{ fontWeight: 700 }}>USD ≈ ${Math.round(dollarRate).toLocaleString('es-AR')}</span>
        {dollarUpdatedAt && <span style={{ color: 'var(--ink-3)' }}>{timeAgo(dollarUpdatedAt)}</span>}
      </div>
      <button onClick={() => setShowPeriodModal(true)} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)',
        background: '#fff', color: 'var(--ink)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
        Exportar resumen
      </button>
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
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title="Dashboard Ejecutivo" crumb="CRM" search={false} right={rightControls} />

      <div className="page-pad" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', flex: 1 }}>

        {/* ── Row 1: Embudo del negocio (centro) + KPIs de apoyo (costado) ── */}
        <div className="grid-2col-resp" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Embudo del negocio · consulta → escritura</h3>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>valor en {currency}</span>
            </CardHeader>
            <div style={{ padding: '8px 0 12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 96px 64px', padding: '8px 20px', fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
                <span>Etapa</span><span>Valor en etapa</span>
                <span style={{ textAlign: 'right' }}>Leads</span>
                <span style={{ textAlign: 'right' }}>Pasa</span>
              </div>
              {funnel.rows.map((r, i) => {
                const isBn = r.key === funnel.bnKey
                const barW = Math.max(3, (r.count / funnel.maxCount) * 100)
                const ret = i > 0 && funnel.rows[i - 1].count > 0 ? Math.round((r.count / funnel.rows[i - 1].count) * 100) : null
                const usdShown = currency === 'USD' ? r.usd : r.usd * dollarRate
                return (
                  <div key={r.key} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 96px 64px', padding: '12px 20px', alignItems: 'center', borderBottom: i < funnel.rows.length - 1 ? '1px solid var(--border)' : undefined, background: isBn ? 'var(--danger-soft)' : 'transparent', boxShadow: isBn ? 'inset 3px 0 0 var(--danger)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: isBn ? 700 : 600, color: isBn ? 'var(--danger)' : 'var(--ink)' }}>{r.name}</span>
                      {isBn && <span style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#fff', background: 'var(--danger)', borderRadius: 999, padding: '1px 6px' }}>Cuello</span>}
                    </div>
                    <div style={{ paddingRight: 14 }}>
                      <div style={{ height: 22, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
                        <div style={{ height: '100%', width: `${barW}%`, background: isBn ? 'var(--danger)' : 'var(--gold)', opacity: isBn ? 1 : 0.5, borderRadius: 4, transition: 'width .5s' }} />
                        <span className="num" style={{ position: 'absolute', left: 8, top: 0, height: 22, display: 'flex', alignItems: 'center', fontSize: 11, fontWeight: 600, color: isBn && barW > 30 ? '#fff' : 'var(--ink-2)' }}>
                          {currency} {compactNum(usdShown)}
                        </span>
                      </div>
                    </div>
                    <div className="num" style={{ textAlign: 'right', fontWeight: 700, fontSize: 14 }}>{r.count}</div>
                    <div className="num" style={{ textAlign: 'right', fontSize: 12, fontWeight: 600, color: ret !== null && ret < 50 ? 'var(--danger)' : 'var(--ink-3)' }}>
                      {ret !== null ? `${ret}%` : '—'}
                    </div>
                  </div>
                )
              })}
              <div style={{ padding: '12px 20px 4px', fontSize: 11.5, color: 'var(--ink-3)' }}>
                {funnel.bnKey
                  ? <>Cuello de botella en <strong style={{ color: 'var(--danger)' }}>{funnel.rows.find(r => r.key === funnel.bnKey)?.name}</strong>: es donde más leads se quedan en el camino.</>
                  : 'Sin datos suficientes para detectar el cuello de botella.'}
              </div>
            </div>
          </Card>

          {/* KPIs de apoyo, apilados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Pipeline Total</div>
              <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 24, marginTop: 6, letterSpacing: '-0.02em' }}>{pipelineDisplay}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{pipelineSub}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Cierres este mes</div>
              <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 24, marginTop: 6, color: 'var(--success)' }}>{closedThisMonth.length}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{closedDisplay} · tasa {closureRate}%</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Ticket promedio</div>
              <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 22, marginTop: 6 }}>{ticketDisplay}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>Sobre cierres</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
              <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>Propiedades activas</div>
              <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 24, marginTop: 6 }}>{activeProperties}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>En cartera disponible</div>
            </div>
          </div>
        </div>

        {/* ── Row 2: Cierres recientes + Origen accionable ── */}
        <div className="grid-2col-resp" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
          <Card>
            <CardHeader>
              <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Cierres recientes</h3>
              {recentClosures.length > 0 && <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>últimas escrituras</span>}
            </CardHeader>
            {recentClosures.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                Aún no hay cierres registrados.
              </div>
            ) : (
              <div>
                {recentClosures.map((c, i) => {
                  const amount = currency === 'USD' ? fmtUSD(c.usd) : fmtARS(c.usd * dollarRate)
                  return (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: i < recentClosures.length - 1 ? '1px solid var(--border)' : undefined }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--success-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 2 }}>
                          {c.date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}{c.agent ? ` · ${c.agent}` : ''}
                        </div>
                      </div>
                      <div className="num" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--success)', flexShrink: 0 }}>{amount}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader>
              <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-jakarta)' }}>Origen de los leads</h3>
            </CardHeader>
            <div style={{ padding: '16px 20px 8px' }}>
              <DonutChart data={originData} />
            </div>
            {/* Accionable: qué canal genera más CIERRES, no solo leads */}
            <div style={{ padding: '4px 20px 18px' }}>
              {channels.top && (
                <div style={{ padding: '10px 12px', borderRadius: 'var(--radius)', background: 'var(--gold-soft)', border: '1px solid #E2D4B5', marginBottom: 12, fontSize: 12, color: '#6E5630' }}>
                  Mejor canal por cierres: <strong>{channels.top.label}</strong> ({channels.top.closed} {channels.top.closed === 1 ? 'cierre' : 'cierres'})
                </div>
              )}
              <div style={{ fontSize: 10.5, color: 'var(--ink-3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Conversión por canal</div>
              {channels.arr.filter(c => c.leads > 0).sort((a, b) => b.closed - a.closed || b.leads - a.leads).map(c => {
                const conv = c.leads > 0 ? Math.round((c.closed / c.leads) * 100) : 0
                return (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'var(--ink-2)' }}>{c.label}</span>
                    <span className="num" style={{ color: 'var(--ink-3)' }}>{c.closed}/{c.leads}</span>
                    <span className="num" style={{ fontWeight: 700, color: conv > 0 ? 'var(--gold)' : 'var(--ink-4)', minWidth: 38, textAlign: 'right' }}>{conv}%</span>
                  </div>
                )
              })}
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
              <span>#</span><span>Agente</span>
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

      {showPeriodModal && (
        <PeriodModal
          onClose={() => setShowPeriodModal(false)}
          onSelect={(period, month, year) => exportPDF({ leads, agents, dollarRate, currency, closureRate, closed, totalAmountUSD, avgTicketUSD, activeProperties, period, month, year })}
        />
      )}
    </div>
  )
}
