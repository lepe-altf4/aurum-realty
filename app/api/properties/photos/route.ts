import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const BUCKET = 'property-photos'

// Verifica que quien llama sea un agente real (cualquier rol). Devuelve el
// admin client para escribir sin depender de las policies de Storage/RLS.
async function authorize(): Promise<{ admin: SupabaseClient } | { error: string; status: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', status: 401 }
  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle()
  if (!agent) return { error: 'No sos un agente de la organización', status: 403 }
  return { admin: createAdminClient() }
}

// Recalcula la portada (properties.photo_url) = foto de menor position.
async function syncCover(admin: SupabaseClient, propertyId: string) {
  const { data } = await admin
    .from('property_photos')
    .select('url')
    .eq('property_id', propertyId)
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle()
  await admin.from('properties').update({ photo_url: data?.url ?? null }).eq('id', propertyId)
}

// POST — subir una foto (FormData: file, propertyId, position)
export async function POST(req: Request) {
  const auth = await authorize()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { admin } = auth

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }
  const file = form.get('file')
  const propertyId = String(form.get('propertyId') ?? '')
  const position = Number(form.get('position') ?? 0)

  if (!propertyId || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Falta el archivo o la propiedad' }, { status: 400 })
  }

  const path = `${propertyId}/${crypto.randomUUID()}.webp`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: upErr } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'image/webp', upsert: false })
  if (upErr) return NextResponse.json({ error: `No se pudo subir la imagen: ${upErr.message}` }, { status: 500 })

  const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path)
  const { data: row, error: insErr } = await admin
    .from('property_photos')
    .insert({ property_id: propertyId, url: pub.publicUrl, storage_path: path, position })
    .select('*')
    .single()

  if (insErr) {
    await admin.storage.from(BUCKET).remove([path])
    return NextResponse.json({ error: `No se pudo guardar la foto: ${insErr.message}` }, { status: 500 })
  }

  await syncCover(admin, propertyId)
  return NextResponse.json({ photo: row }, { status: 201 })
}

// DELETE — borrar una foto (JSON: { photoId })
export async function DELETE(req: Request) {
  const auth = await authorize()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { admin } = auth

  const { photoId } = await req.json().catch(() => ({ photoId: null }))
  if (!photoId) return NextResponse.json({ error: 'Falta photoId' }, { status: 400 })

  const { data: photo } = await admin.from('property_photos').select('*').eq('id', photoId).maybeSingle()
  if (!photo) return NextResponse.json({ error: 'Foto no encontrada' }, { status: 404 })

  if (photo.storage_path) await admin.storage.from(BUCKET).remove([photo.storage_path])
  const { error } = await admin.from('property_photos').delete().eq('id', photoId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await syncCover(admin, photo.property_id)
  return NextResponse.json({ ok: true })
}

// PUT — reordenar (JSON: { propertyId, orderedIds })
export async function PUT(req: Request) {
  const auth = await authorize()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { admin } = auth

  const { propertyId, orderedIds } = await req.json().catch(() => ({}))
  if (!propertyId || !Array.isArray(orderedIds)) {
    return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 })
  }

  await Promise.all(
    orderedIds.map((id: string, i: number) =>
      admin.from('property_photos').update({ position: i }).eq('id', id).eq('property_id', propertyId)
    )
  )
  await syncCover(admin, propertyId)
  return NextResponse.json({ ok: true })
}
