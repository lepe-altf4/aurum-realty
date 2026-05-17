export default function KpiCard({ label, value, sub, delta, deltaDir = 'up' }: {
  label: string
  value: string | number
  sub?: string
  delta?: string
  deltaDir?: 'up' | 'down'
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '18px 20px' }}>
      <div style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 600 }}>{label}</div>
      <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: 700, fontSize: 30, marginTop: 8, letterSpacing: '-0.02em' }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12, color: 'var(--ink-3)' }}>
        {delta && <span style={{ color: deltaDir === 'up' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>{deltaDir === 'up' ? '▲' : '▼'} {delta}</span>}
        {sub && <span>{sub}</span>}
      </div>
    </div>
  )
}
