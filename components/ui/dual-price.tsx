'use client'
import { fmtUSD, fmtARS } from '@/lib/format'

const SIZES = {
  hero: { p: 52, s: 14, w: 700, ls: '-0.025em', gap: 6 },
  xl:   { p: 40, s: 12, w: 700, ls: '-0.022em', gap: 5 },
  lg:   { p: 30, s: 12, w: 700, ls: '-0.02em',  gap: 4 },
  md:   { p: 22, s: 11, w: 700, ls: '-0.015em', gap: 3 },
  sm:   { p: 16, s: 11, w: 700, ls: '-0.01em',  gap: 2 },
  xs:   { p: 13, s: 10, w: 700, ls: '-0.005em', gap: 2 },
} as const

type SizeKey = keyof typeof SIZES

export default function DualPrice({
  usd, primary, dollarRate, size = 'md', suffix = '', align = 'left',
}: {
  usd: number
  primary: 'USD' | 'ARS'
  dollarRate: number
  size?: SizeKey
  suffix?: string
  align?: 'left' | 'right'
}) {
  const ars = usd * dollarRate
  const sz = SIZES[size]
  const [primaryStr, secondaryStr] = primary === 'USD'
    ? [`USD ${Math.round(usd).toLocaleString('es-AR')}${suffix}`, `≈ ARS ${Math.round(ars).toLocaleString('es-AR')}${suffix}`]
    : [`ARS ${Math.round(ars).toLocaleString('es-AR')}${suffix}`, `≈ USD ${Math.round(usd).toLocaleString('es-AR')}${suffix}`]

  return (
    <div style={{ textAlign: align }}>
      <div className="num" style={{ fontFamily: 'var(--font-jakarta)', fontWeight: sz.w, fontSize: sz.p, letterSpacing: sz.ls, lineHeight: 1.05, color: 'var(--ink)' }}>
        {primaryStr}
      </div>
      <div className="num" style={{ color: 'var(--ink-3)', fontSize: sz.s, marginTop: sz.gap, fontWeight: 500, opacity: 0.85 }}>
        {secondaryStr}
      </div>
    </div>
  )
}
