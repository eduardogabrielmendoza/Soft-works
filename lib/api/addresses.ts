import { createBrowserClient } from '@supabase/ssr'
import type { Direccion, PROVINCIAS_ARGENTINA } from '@/lib/types/database.types'

// Cliente sin tipado estricto hasta que el schema exista
function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as any
}

// Provincias de Argentina
export const ARGENTINA_PROVINCES = [
  'Ciudad Autónoma de Buenos Aires',
  'Buenos Aires',
  'Buenos Aires - GBA Norte',
  'Buenos Aires - GBA Sur',
  'Buenos Aires - GBA Oeste',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán'
]

export async function getUserAddresses(userId: string): Promise<Direccion[]> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('direcciones')
    .select('*')
    .eq('usuario_id', userId)
    .order('es_predeterminada', { ascending: false })
    .order('fecha_creacion', { ascending: false })

  if (error) {
    console.error('Error fetching addresses:', error)
    return []
  }

  return data as Direccion[]
}

export async function getAddressById(addressId: string): Promise<Direccion | null> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('direcciones')
    .select('*')
    .eq('id', addressId)
    .single()

  if (error) {
    console.error('Error fetching address:', error)
    return null
  }

  return data as Direccion
}

export async function createAddress(
  address: Omit<Direccion, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>
): Promise<Direccion | null> {
  const supabase = getSupabase()
  
  // Si es la primera dirección o se marca como default, actualizar las demás
  if (address.es_predeterminada) {
    await supabase
      .from('direcciones')
      .update({ es_predeterminada: false })
      .eq('usuario_id', address.usuario_id)
  }

  const { data, error } = await supabase
    .from('direcciones')
    .insert(address)
    .select()
    .single()

  if (error) {
    console.error('Error creating address:', error)
    return null
  }

  return data as Direccion
}

export async function updateAddress(
  addressId: string,
  userId: string,
  updates: Partial<Omit<Direccion, 'id' | 'usuario_id' | 'fecha_creacion' | 'fecha_actualizacion'>>
): Promise<Direccion | null> {
  const supabase = getSupabase()
  
  // Si se marca como default, quitar default de las demás
  if (updates.es_predeterminada) {
    await supabase
      .from('direcciones')
      .update({ es_predeterminada: false })
      .eq('usuario_id', userId)
  }

  const { data, error } = await supabase
    .from('direcciones')
    .update(updates)
    .eq('id', addressId)
    .eq('usuario_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating address:', error)
    return null
  }

  return data as Direccion
}

export async function deleteAddress(addressId: string, userId: string): Promise<boolean> {
  const supabase = getSupabase()
  
  const { error } = await supabase
    .from('direcciones')
    .delete()
    .eq('id', addressId)
    .eq('usuario_id', userId)

  if (error) {
    console.error('Error deleting address:', error)
    return false
  }

  return true
}

export async function setDefaultAddress(addressId: string, userId: string): Promise<boolean> {
  const supabase = getSupabase()
  
  // Quitar default de todas
  await supabase
    .from('direcciones')
    .update({ es_predeterminada: false })
    .eq('usuario_id', userId)

  // Poner default a la seleccionada
  const { error } = await supabase
    .from('direcciones')
    .update({ es_predeterminada: true })
    .eq('id', addressId)
    .eq('usuario_id', userId)

  if (error) {
    console.error('Error setting default address:', error)
    return false
  }

  return true
}

// Alias para compatibilidad
export { Direccion as Address }
