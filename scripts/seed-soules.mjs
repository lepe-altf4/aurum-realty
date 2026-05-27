/**
 * Seed script — Soules Inmobiliaria demo data
 * Replaces all existing properties and leads with real Soules data from Cipolletti.
 * Run: node scripts/seed-soules.mjs
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required')
  process.exit(1)
}

const BASE_HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
}

async function api(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: { ...BASE_HEADERS, ...opts.headers },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${opts.method ?? 'GET'} ${path} → ${res.status}: ${text}`)
  return text ? JSON.parse(text) : null
}

// ─── 1. PROPERTIES (Soules Inmobiliaria — Cipolletti, Río Negro) ────────────
const PROPERTIES = [
  // ── VENTAS ──────────────────────────────────────────────────────────────
  {
    address: 'Belgrano 467, 4°C',
    neighborhood: 'Centro',
    type: 'Departamento',
    operation: 'Venta',
    price_usd: 225000,
    price_ars: 236250000,
    currency_listing: 'USD',
    sqm: 80,
    rooms: 2,
    status: 'Disponible',
    premium: true,
    description: '2 dormitorios, 1 baño. Impecable estado, piso de madera, vista despejada. Cod. 6652',
    photo_url: 'https://www.soules.com.ar/V4/wp-content/uploads/2026/04/6652-Feed-02-244x163.jpg',
  },
  {
    address: 'Av. Roca 1580, Edif. Arrayanes 3°B',
    neighborhood: 'Centro',
    type: 'Departamento',
    operation: 'Venta',
    price_usd: 200000,
    price_ars: 210000000,
    currency_listing: 'USD',
    sqm: 104,
    rooms: 3,
    status: 'Disponible',
    premium: true,
    description: '3 dormitorios, 2 baños, cochera. Edificio Arrayanes, amenities completos. Cod. 6668',
    photo_url: 'https://www.soules.com.ar/V4/wp-content/uploads/2026/05/Feed-7003-01-244x163.jpg',
  },
  {
    address: 'Los Robles 234',
    neighborhood: 'Barrio Capellán',
    type: 'Casa',
    operation: 'Venta',
    price_usd: 330000,
    price_ars: 346500000,
    currency_listing: 'USD',
    sqm: 148,
    rooms: 3,
    status: 'Disponible',
    premium: true,
    description: '3 dormitorios, 2 baños, jardín y garaje doble. Barrio Capellán, calle privada. Cod. 6657',
    photo_url: 'https://www.soules.com.ar/V4/wp-content/uploads/2026/04/Feed-6657-04-1-244x163.jpg',
  },
  {
    address: 'Juan B. Justo 1456, PB B',
    neighborhood: 'San Pablo',
    type: 'Departamento',
    operation: 'Venta',
    price_usd: 75000,
    price_ars: 78750000,
    currency_listing: 'USD',
    sqm: 58,
    rooms: 2,
    status: 'Disponible',
    premium: false,
    description: '2 dormitorios, 1 baño. Planta baja con patio privado. Barrio San Pablo. Cod. 6653',
    photo_url: 'https://www.soules.com.ar/V4/wp-content/uploads/2026/04/6653-Feed-06-244x163.jpg',
  },
  {
    address: 'Almirante Brown esq. Rivadavia',
    neighborhood: 'Almirante Brown',
    type: 'Lote',
    operation: 'Venta',
    price_usd: 42000,
    price_ars: 44100000,
    currency_listing: 'USD',
    sqm: 300,
    rooms: 0,
    status: 'Disponible',
    premium: false,
    description: 'Terreno 300 m², todos los servicios en vereda. Barrio Almirante Brown. Cod. 6661',
    photo_url: 'https://www.soules.com.ar/V4/wp-content/uploads/2026/04/Feed-6661-02-244x163.jpg',
  },
  // ── ALQUILERES ──────────────────────────────────────────────────────────
  {
    address: 'Belgrano 243, 3°A',
    neighborhood: 'Centro',
    type: 'Departamento',
    operation: 'Alquiler',
    price_usd: 1143,
    price_ars: 1200000,
    currency_listing: 'ARS',
    sqm: 46,
    rooms: 1,
    status: 'Disponible',
    premium: false,
    description: '1 dormitorio, 1 baño. Luminoso, amoblado. A pasos de la peatonal. Cod. 6670',
    photo_url: 'https://www.soules.com.ar/V4/wp-content/uploads/2026/05/Feed-6670-02-244x163.jpg',
  },
  {
    address: 'Juan B. Justo 890, 2°',
    neighborhood: 'San Pablo',
    type: 'Departamento',
    operation: 'Alquiler',
    price_usd: 905,
    price_ars: 950000,
    currency_listing: 'ARS',
    sqm: 45,
    rooms: 1,
    status: 'Disponible',
    premium: false,
    description: '1 dormitorio, 1 baño. Barrio San Pablo, tranquilo y arbolado. Cod. 6669',
    photo_url: 'https://www.soules.com.ar/V4/wp-content/uploads/2026/05/Feed-6669-05-244x163.jpg',
  },
  {
    address: 'Av. Roca 2890',
    neighborhood: 'Barrio del Trabajo',
    type: 'Casa',
    operation: 'Alquiler',
    price_usd: 1429,
    price_ars: 1500000,
    currency_listing: 'ARS',
    sqm: 70,
    rooms: 3,
    status: 'Disponible',
    premium: false,
    description: 'Casa 3 dormitorios, patio y garaje. Barrio del Trabajo. Cod. 6667',
    photo_url: 'https://www.soules.com.ar/V4/wp-content/uploads/2026/05/Feed-6667-02-244x163.jpg',
  },
  {
    address: 'San Martín 567, 2°B',
    neighborhood: 'Centro',
    type: 'Departamento',
    operation: 'Alquiler',
    price_usd: 1619,
    price_ars: 1700000,
    currency_listing: 'ARS',
    sqm: 72,
    rooms: 2,
    status: 'Disponible',
    premium: false,
    description: '2 dormitorios, 1 baño. Edificio moderno, balcón corrido, cochera opcional. Cod. 6666',
    photo_url: 'https://www.soules.com.ar/V4/wp-content/uploads/2026/05/Feed-6666-03-244x163.jpg',
  },
  {
    address: 'Av. 12 de Octubre 1240, 1°A',
    neighborhood: '12 de Octubre',
    type: 'Departamento',
    operation: 'Alquiler',
    price_usd: 1429,
    price_ars: 1500000,
    currency_listing: 'ARS',
    sqm: 60,
    rooms: 2,
    status: 'Reservada',
    premium: false,
    description: '2 dormitorios, 1 baño. Barrio 12 de Octubre, cerca de colegios y comercios. Cod. 6595',
    photo_url: 'https://www.soules.com.ar/V4/wp-content/uploads/2026/05/Feed-6595-05-244x163.jpg',
  },
]

// ─── 2. LEADS ───────────────────────────────────────────────────────────────
// Built after property + stage + agent IDs are resolved.
function buildLeads(propIds, stageIds, agentIds) {
  const mp = agentIds['mariana@aurum.com.ar']
  const jt = agentIds['joaquin@aurum.com.ar']
  const vs = agentIds['valentina@aurum.com.ar']

  const consulta  = stageIds['consulta']
  const visita    = stageIds['visita']
  const oferta    = stageIds['oferta']
  const reserva   = stageIds['reserva']
  const escritura = stageIds['escritura']

  const daysAgo = (n) => {
    const d = new Date()
    d.setDate(d.getDate() - n)
    return d.toISOString()
  }

  return [
    // ── CONSULTA (2) ────────────────────────────────────────────────────
    {
      name: 'María Laura Fernández',
      phone: '+54 9 299 408-1234',
      email: 'ml.fernandez@gmail.com',
      origin: 'WhatsApp',
      property_id: propIds['Belgrano 243, 3°A'],
      operation: 'Alquiler',
      stage_id: consulta,
      agent_id: vs,
      amount: 1200000,
      currency: 'ARS',
      hot: false,
      score: 48,
      days_without_contact: 2,
      next_action_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      notes: 'Busca para mudarse en julio. Consulta si admite mascotas (perro mediano).',
      created_at: daysAgo(13),
    },
    {
      name: 'Diego Balcarce',
      phone: '+54 9 299 512-5678',
      email: 'd.balcarce@hotmail.com',
      origin: 'ZonaProp',
      property_id: propIds['Almirante Brown esq. Rivadavia'],
      operation: 'Venta',
      stage_id: consulta,
      agent_id: jt,
      amount: 42000,
      currency: 'USD',
      hot: false,
      score: 42,
      days_without_contact: 4,
      next_action_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      notes: 'Interesado en construir su primera vivienda. Consulta por planos y escritura.',
      created_at: daysAgo(10),
    },
    // ── VISITA (2) ──────────────────────────────────────────────────────
    {
      name: 'Karina Villanueva',
      phone: '+54 9 299 315-9012',
      email: 'kari.villanueva@gmail.com',
      origin: 'Instagram',
      property_id: propIds['San Martín 567, 2°B'],
      operation: 'Alquiler',
      stage_id: visita,
      agent_id: vs,
      amount: 1700000,
      currency: 'ARS',
      hot: true,
      score: 81,
      days_without_contact: 1,
      next_action_date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
      notes: 'HOT — necesita mudarse urgente, fin de mes. Visita confirmada para el sábado 10h.',
      created_at: daysAgo(8),
    },
    {
      name: 'Rodrigo Peralta',
      phone: '+54 9 2994 234-3456',
      email: 'r.peralta@empresa.com.ar',
      origin: 'Referido',
      property_id: propIds['Los Robles 234'],
      operation: 'Venta',
      stage_id: visita,
      agent_id: mp,
      amount: 330000,
      currency: 'USD',
      hot: false,
      score: 67,
      days_without_contact: 3,
      next_action_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      notes: 'Referido por Graciela Orozco. Ya visitó una vez, pide segunda visita con su pareja.',
      created_at: daysAgo(7),
    },
    // ── OFERTA (2) ──────────────────────────────────────────────────────
    {
      name: 'Graciela Orozco',
      phone: '+54 9 299 417-7890',
      email: 'g.orozco@outlook.com',
      origin: 'Web',
      property_id: propIds['Belgrano 467, 4°C'],
      operation: 'Venta',
      stage_id: oferta,
      agent_id: mp,
      amount: 210000,
      currency: 'USD',
      hot: true,
      score: 88,
      days_without_contact: 0,
      next_action_date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
      notes: 'Ofertó USD 210.000. Propietario contrapropone USD 218.000. Cierre inminente.',
      created_at: daysAgo(5),
    },
    {
      name: 'Sebastián Carballo',
      phone: '+54 9 299 523-2345',
      email: 'seba.carballo@gmail.com',
      origin: 'ZonaProp',
      property_id: propIds['Av. Roca 1580, Edif. Arrayanes 3°B'],
      operation: 'Venta',
      stage_id: oferta,
      agent_id: jt,
      amount: 195000,
      currency: 'USD',
      hot: false,
      score: 72,
      days_without_contact: 2,
      next_action_date: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0],
      notes: 'Oferta presentada por USD 195.000. Espera respuesta del propietario antes del viernes.',
      created_at: daysAgo(4),
    },
    // ── RESERVA (1) ─────────────────────────────────────────────────────
    {
      name: 'Natalia Soto',
      phone: '+54 9 299 416-6789',
      email: 'nati.soto@gmail.com',
      origin: 'WhatsApp',
      property_id: propIds['Juan B. Justo 1456, PB B'],
      operation: 'Venta',
      stage_id: reserva,
      agent_id: mp,
      amount: 75000,
      currency: 'USD',
      hot: true,
      score: 94,
      days_without_contact: 0,
      next_action_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      notes: 'Reserva firmada. Seña del 10% abonada. Escritura pactada para el 1° de junio en escribanía Ríos.',
      created_at: daysAgo(2),
    },
    // ── ESCRITURA (1) ───────────────────────────────────────────────────
    {
      name: 'Verónica Mansilla',
      phone: '+54 9 299 621-0123',
      email: 'vero.mansilla@gmail.com',
      origin: 'Referido',
      property_id: propIds['Av. 12 de Octubre 1240, 1°A'],
      operation: 'Alquiler',
      stage_id: escritura,
      agent_id: vs,
      amount: 1500000,
      currency: 'ARS',
      hot: false,
      score: 96,
      days_without_contact: 0,
      next_action_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
      notes: 'Contrato de alquiler 36 meses firmado y certificado. Entrega de llaves el 1° de junio.',
      created_at: daysAgo(15),
    },
  ]
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🏠 Soules Inmobiliaria — Cargando datos de demo\n')

  // 0. Update organization info
  process.stdout.write('  → Actualizando organización... ')
  const [existingOrg] = await api('/organization?select=id&limit=1')
  if (existingOrg) {
    await api(`/organization?id=eq.${existingOrg.id}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        name: 'Soules Inmobiliaria',
        address: '9 de Julio 376, Cipolletti, Río Negro',
      }),
    })
  } else {
    await api('/organization', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        name: 'Soules Inmobiliaria',
        cuit: '30-71204938-2',
        address: '9 de Julio 376, Cipolletti, Río Negro',
        dollar_rate: 1245,
      }),
    })
  }
  console.log('✓')

  // 1. Delete existing leads first (activities cascade)
  process.stdout.write('  → Borrando leads existentes... ')
  await api('/leads?created_at=gte.2000-01-01', {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  })
  console.log('✓')

  // 2. Delete existing properties
  process.stdout.write('  → Borrando propiedades existentes... ')
  await api('/properties?created_at=gte.2000-01-01', {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' },
  })
  console.log('✓')

  // 3. Insert Soules properties
  process.stdout.write(`  → Insertando ${PROPERTIES.length} propiedades de Soules... `)
  const insertedProps = await api('/properties', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(PROPERTIES),
  })
  console.log(`✓  (${insertedProps.length} propiedades)`)

  // Build address → id map
  const propIds = {}
  for (const p of insertedProps) propIds[p.address] = p.id

  // 4. Fetch stage IDs
  const stages = await api('/pipeline_stages?select=id,key')
  const stageIds = Object.fromEntries(stages.map((s) => [s.key, s.id]))

  // 5. Fetch agent IDs
  const agents = await api('/agents?select=id,email')
  const agentIds = Object.fromEntries(agents.map((a) => [a.email, a.id]))

  // 6. Insert leads
  const leads = buildLeads(propIds, stageIds, agentIds)
  process.stdout.write(`  → Insertando ${leads.length} leads... `)
  const insertedLeads = await api('/leads', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(leads),
  })
  console.log(`✓  (${insertedLeads.length} leads)`)

  // 7. Insert sample activities for the hottest leads
  const hotLeads = insertedLeads.filter((l) => l.hot)
  const mariana = agentIds['mariana@aurum.com.ar']
  const joaquin = agentIds['joaquin@aurum.com.ar']
  const valentina = agentIds['valentina@aurum.com.ar']

  const activities = []
  for (const lead of hotLeads) {
    const agId = lead.agent_id
    const name = lead.name
    activities.push(
      { lead_id: lead.id, agent_id: agId, type: 'WhatsApp',     description: `Primer contacto con ${name} por WhatsApp. Se envió ficha de la propiedad.`,          created_at: new Date(Date.now() - 8 * 86400000).toISOString() },
      { lead_id: lead.id, agent_id: agId, type: 'Llamada',      description: `Llamado de seguimiento. ${name} confirma interés y solicita más información.`,       created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
      { lead_id: lead.id, agent_id: agId, type: 'Visita',       description: `Visita realizada a la propiedad. Cliente muy interesado, pregunta por financiación.`, created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
      { lead_id: lead.id, agent_id: agId, type: 'Cambio_etapa', description: `Lead avanzado a etapa siguiente tras interés confirmado.`,                           created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
    )
  }

  process.stdout.write(`  → Insertando ${activities.length} actividades... `)
  await api('/activities', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify(activities),
  })
  console.log('✓')

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n✅ Carga completa!\n')
  console.log(`   Propiedades : ${insertedProps.length}`)
  console.log(`   Leads       : ${insertedLeads.length}`)
  console.log(`     - Consulta  : ${insertedLeads.filter((l) => l.stage_id === stageIds.consulta).length}`)
  console.log(`     - Visita    : ${insertedLeads.filter((l) => l.stage_id === stageIds.visita).length}`)
  console.log(`     - Oferta    : ${insertedLeads.filter((l) => l.stage_id === stageIds.oferta).length}`)
  console.log(`     - Reserva   : ${insertedLeads.filter((l) => l.stage_id === stageIds.reserva).length}`)
  console.log(`     - Escritura : ${insertedLeads.filter((l) => l.stage_id === stageIds.escritura).length}`)
  console.log(`   Actividades : ${activities.length}`)
  console.log('\n🌐 Verificar en: https://aurum-realty-zeta.vercel.app\n')
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message)
  process.exit(1)
})
