export const fmtUSD = (n: number) =>
  'USD ' + Math.round(n).toLocaleString('es-AR')

export const fmtARS = (n: number) =>
  '$ ' + Math.round(n).toLocaleString('es-AR')

export const fmtNum = (n: number) => n.toLocaleString('es-AR')

export function fmtPrice(price: number, currency: 'USD' | 'ARS', operation: 'Venta' | 'Alquiler') {
  const base = currency === 'USD' ? fmtUSD(price) : fmtARS(price)
  return operation === 'Alquiler' ? `${base} /mes` : base
}

export function compactNum(n: number): string {
  if (n >= 1_000_000_000) {
    const b = n / 1_000_000_000
    return (b >= 10 ? Math.round(b).toString() : b.toFixed(1).replace(/\.0$/, '')).replace('.', ',') + 'B'
  }
  if (n >= 1_000_000) {
    const m = n / 1_000_000
    return (m >= 10 ? Math.round(m).toString() : m.toFixed(1).replace(/\.0$/, '')).replace('.', ',') + 'M'
  }
  if (n >= 1_000) return Math.round(n / 1000) + 'K'
  return n.toString()
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 0) return 'recién'
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'recién'
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return d === 1 ? 'hace 1 día' : `hace ${d} días`
}

export function dualPrice(usdAmount: number, primary: 'USD' | 'ARS', dollarRate: number) {
  const arsAmount = usdAmount * dollarRate
  if (primary === 'USD') {
    return { primary: fmtUSD(usdAmount), secondary: fmtARS(arsAmount) }
  }
  return { primary: fmtARS(arsAmount), secondary: fmtUSD(usdAmount) }
}
