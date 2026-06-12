export interface PipelineStage {
  id: string
  name: string
  position: number
  key: string
}

export interface Agent {
  id: string
  auth_user_id: string | null
  name: string
  email: string
  role: 'Admin' | 'Senior' | 'Agente' | 'Junior'
  commission_pct: number
  status: 'Activo' | 'Inactivo' | 'Pendiente'
  initials: string | null
  created_at: string
}

export interface Organization {
  id: string
  name: string
  cuit: string | null
  address: string | null
  dollar_rate: number
  dollar_rate_updated_at?: string | null
  dollar_rate_source?: 'auto' | 'manual'
  created_at: string
}

export interface Property {
  id: string
  address: string
  neighborhood: string | null
  type: 'Casa' | 'Departamento' | 'Lote' | 'Local'
  operation: 'Venta' | 'Alquiler'
  price_usd: number | null
  price_ars: number | null
  currency_listing: 'USD' | 'ARS'
  sqm: number | null
  rooms: number | null
  status: 'Disponible' | 'Reservada' | 'Vendida' | 'Alquilada'
  premium: boolean
  description: string | null
  photo_url: string | null
  created_at: string
}

export interface Lead {
  id: string
  name: string
  phone: string | null
  email: string | null
  origin: 'WhatsApp' | 'Instagram' | 'ZonaProp' | 'Argenprop' | 'Web' | 'Referido' | null
  property_id: string | null
  operation: 'Venta' | 'Alquiler' | null
  stage_id: string | null
  agent_id: string | null
  owner_id?: string | null
  status_asignacion?: 'pool' | 'pendiente_aprobacion' | 'asignado'
  amount: number | null
  currency: 'USD' | 'ARS'
  hot: boolean
  score: number
  days_without_contact: number
  last_contact_at?: string | null
  next_action_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  property?: Property | null
  stage?: PipelineStage | null
  agent?: Agent | null
}

export interface Activity {
  id: string
  lead_id: string | null
  agent_id: string | null
  type: 'Nota' | 'Llamada' | 'Email' | 'WhatsApp' | 'Visita' | 'Cambio_etapa'
  description: string
  created_at: string
  agent?: Agent | null
}

export interface LeadClaim {
  id: string
  lead_id: string
  agente_id: string
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  created_at: string
  resolved_at: string | null
  resolved_by: string | null
  // joined
  lead?: Lead | null
  agente?: Agent | null
}

export type OpFilter = 'Todas' | 'Venta' | 'Alquiler'
export type CurrencyPrimary = 'USD' | 'ARS'
