export function Tag({ children, variant = 'default', dot = false }: {
  children: React.ReactNode
  variant?: 'default' | 'gold' | 'success' | 'danger' | 'ink' | 'outline'
  dot?: boolean
}) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: 'var(--surface)', color: 'var(--ink-2)', border: '1px solid var(--border)' },
    gold: { background: 'var(--gold-soft)', color: '#6E5630', border: '1px solid #E2D4B5' },
    success: { background: 'var(--success-soft)', color: 'var(--success)', border: '1px solid #C9D9C6' },
    danger: { background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid #E9CDC9' },
    ink: { background: 'var(--ink)', color: '#fff', border: '1px solid var(--ink)' },
    outline: { background: '#fff', color: 'var(--ink-2)', border: '1px solid var(--border)' },
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px', fontSize: 11, fontWeight: 600,
      letterSpacing: '0.04em', borderRadius: 999,
      lineHeight: 1.4, ...styles[variant],
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', opacity: 0.7 }} />}
      {children}
    </span>
  )
}

export function Pill({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 9px', borderRadius: 6,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
      background: '#fff', border: '1px solid var(--border)', color: 'var(--ink-2)',
      ...style,
    }}>{children}</span>
  )
}

export function SourceTag({ src }: { src: string }) {
  if (src === 'WhatsApp') return <Tag variant="success" dot>{src}</Tag>
  if (src === 'Referido') return <Tag variant="gold" dot>{src}</Tag>
  return <Tag dot>{src}</Tag>
}

export function StageTag({ stage }: { stage: { key: string; name: string } | null | undefined }) {
  if (!stage) return null
  if (stage.key === 'escritura') return <Pill style={{ background: 'var(--success-soft)', color: 'var(--success)', border: '1px solid #C9D9C6' }}>{stage.name}</Pill>
  if (stage.key === 'reserva') return <Pill style={{ background: 'var(--gold-soft)', color: '#6E5630', border: '1px solid #E2D4B5' }}>{stage.name}</Pill>
  return <Pill>{stage.name}</Pill>
}

export function OpTag({ op }: { op: string | null }) {
  if (op === 'Venta') return <Pill style={{ background: 'var(--ink)', color: '#fff', border: '1px solid var(--ink)' }}>Venta</Pill>
  return <Pill>Alquiler</Pill>
}

export function StatusTag({ status }: { status: string }) {
  if (status === 'Vendida' || status === 'Alquilada') return <Tag variant="success" dot>{status.toUpperCase()}</Tag>
  if (status === 'Reservada') return <Tag variant="gold" dot>RESERVADA</Tag>
  return <Tag variant="outline" dot>DISPONIBLE</Tag>
}
