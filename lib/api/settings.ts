import { createBrowserClient } from '@supabase/ssr'
import type { CuentaBancaria, ZonaEnvio, ConfiguracionTienda, Json } from '@/lib/types/database.types'

// Cliente sin tipado estricto hasta que el schema exista
function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as any
}

// =============================================
// Cuentas Bancarias
// =============================================

export async function getActiveBankAccounts(): Promise<CuentaBancaria[]> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('cuentas_bancarias')
    .select('*')
    .eq('activa', true)
    .order('orden_visualizacion', { ascending: true })

  if (error) {
    console.error('Error fetching bank accounts:', error)
    return []
  }

  return data as CuentaBancaria[]
}

export async function getAllBankAccounts(): Promise<CuentaBancaria[]> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('cuentas_bancarias')
    .select('*')
    .order('orden_visualizacion', { ascending: true })

  if (error) {
    console.error('Error fetching all bank accounts:', error)
    return []
  }

  return data as CuentaBancaria[]
}

export async function createBankAccount(
  account: Omit<CuentaBancaria, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>
): Promise<CuentaBancaria | null> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('cuentas_bancarias')
    .insert(account)
    .select()
    .single()

  if (error) {
    console.error('Error creating bank account:', error)
    return null
  }

  return data as CuentaBancaria
}

export async function updateBankAccount(
  accountId: string,
  updates: Partial<Omit<CuentaBancaria, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>>
): Promise<CuentaBancaria | null> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('cuentas_bancarias')
    .update(updates)
    .eq('id', accountId)
    .select()
    .single()

  if (error) {
    console.error('Error updating bank account:', error)
    return null
  }

  return data as CuentaBancaria
}

export async function deleteBankAccount(accountId: string): Promise<boolean> {
  const supabase = getSupabase()
  
  const { error } = await supabase
    .from('cuentas_bancarias')
    .delete()
    .eq('id', accountId)

  if (error) {
    console.error('Error deleting bank account:', error)
    return false
  }

  return true
}

// =============================================
// Zonas de Envío
// =============================================

export async function getActiveShippingZones(): Promise<ZonaEnvio[]> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('zonas_envio')
    .select('*')
    .eq('activa', true)
    .order('precio', { ascending: true })

  if (error) {
    console.error('Error fetching shipping zones:', error)
    return []
  }

  return data as ZonaEnvio[]
}

export async function getAllShippingZones(): Promise<ZonaEnvio[]> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('zonas_envio')
    .select('*')
    .order('precio', { ascending: true })

  if (error) {
    console.error('Error fetching all shipping zones:', error)
    return []
  }

  return data as ZonaEnvio[]
}

export async function getShippingZoneByProvince(province: string): Promise<ZonaEnvio | null> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('zonas_envio')
    .select('*')
    .eq('activa', true)
    .contains('provincias', [province])
    .single()

  if (error) {
    // Si no encuentra zona específica, intentar con zona genérica
    console.error('Error fetching shipping zone:', error)
    return null
  }

  return data as ZonaEnvio
}

export async function createShippingZone(
  zone: Omit<ZonaEnvio, 'id' | 'fecha_creacion'>
): Promise<ZonaEnvio | null> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('zonas_envio')
    .insert(zone)
    .select()
    .single()

  if (error) {
    console.error('Error creating shipping zone:', error)
    return null
  }

  return data as ZonaEnvio
}

export async function updateShippingZone(
  zoneId: string,
  updates: Partial<Omit<ZonaEnvio, 'id' | 'fecha_creacion'>>
): Promise<ZonaEnvio | null> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('zonas_envio')
    .update(updates)
    .eq('id', zoneId)
    .select()
    .single()

  if (error) {
    console.error('Error updating shipping zone:', error)
    return null
  }

  return data as ZonaEnvio
}

export async function deleteShippingZone(zoneId: string): Promise<boolean> {
  const supabase = getSupabase()
  
  const { error } = await supabase
    .from('zonas_envio')
    .delete()
    .eq('id', zoneId)

  if (error) {
    console.error('Error deleting shipping zone:', error)
    return false
  }

  return true
}

// =============================================
// Configuración de Tienda
// =============================================

export async function getStoreSettings(): Promise<Record<string, Json>> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('configuracion_tienda')
    .select('clave, valor')

  if (error) {
    console.error('Error fetching store settings:', error)
    return {}
  }

  const settings: Record<string, Json> = {}
  data?.forEach((item: { clave: string; valor: Json }) => {
    settings[item.clave] = item.valor
  })

  return settings
}

export async function getStoreSetting(key: string): Promise<Json | null> {
  const supabase = getSupabase()
  
  const { data, error } = await supabase
    .from('configuracion_tienda')
    .select('valor')
    .eq('clave', key)
    .single()

  if (error) {
    console.error(`Error fetching setting ${key}:`, error)
    return null
  }

  return data?.valor ?? null
}

export async function updateStoreSetting(
  key: string,
  value: Json,
  description?: string
): Promise<boolean> {
  const supabase = getSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { error } = await supabase
    .from('configuracion_tienda')
    .upsert({
      clave: key,
      valor: value,
      descripcion: description,
      actualizado_por: user?.id
    }, {
      onConflict: 'clave'
    })

  if (error) {
    console.error('Error updating store setting:', error)
    return false
  }

  return true
}

// =============================================
// Newsletter
// =============================================

export async function subscribeToNewsletter(email: string): Promise<boolean> {
  const supabase = getSupabase()
  
  const { error } = await supabase
    .from('suscriptores_newsletter')
    .upsert({
      email,
      activo: true
    }, {
      onConflict: 'email'
    })

  if (error) {
    console.error('Error subscribing to newsletter:', error)
    return false
  }

  return true
}

export async function unsubscribeFromNewsletter(email: string): Promise<boolean> {
  const supabase = getSupabase()
  
  const { error } = await supabase
    .from('suscriptores_newsletter')
    .update({
      activo: false,
      desuscrito_el: new Date().toISOString()
    })
    .eq('email', email)

  if (error) {
    console.error('Error unsubscribing from newsletter:', error)
    return false
  }

  return true
}

export async function getNewsletterSubscribers(activeOnly: boolean = true): Promise<{ email: string; suscrito_el: string }[]> {
  const supabase = getSupabase()
  
  let query = supabase
    .from('suscriptores_newsletter')
    .select('email, suscrito_el')
    .order('suscrito_el', { ascending: false })

  if (activeOnly) {
    query = query.eq('activo', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching newsletter subscribers:', error)
    return []
  }

  return data || []
}

// Aliases para compatibilidad
export type { 
  CuentaBancaria as BankAccount, 
  ZonaEnvio as ShippingZone, 
  ConfiguracionTienda as StoreSetting 
}
