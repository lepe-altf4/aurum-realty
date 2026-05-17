export default function TypeIcon({ type, size = 14 }: { type: string; size?: number }) {
  const s = { width: size, height: size }
  if (type === 'Casa') return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 4l9 6.5V20H3z"/></svg>
  if (type === 'Lote') return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8" strokeDasharray="3 3"/><circle cx="12" cy="12" r="2.5"/></svg>
  if (type === 'Local') return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1.5-4h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-7h6v7"/></svg>
  // Departamento
  return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/></svg>
}
