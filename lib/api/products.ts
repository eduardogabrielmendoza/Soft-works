import { getSupabaseClient } from '@/lib/supabase/client'
import type { Producto, CategoriaProducto } from '@/lib/types/database.types'

// =============================================
// Funciones públicas (para clientes)
// =============================================

export async function getProducts(filters?: {
  category?: CategoriaProducto
  featured?: boolean
  limit?: number
  offset?: number
}): Promise<Producto[]> {
  const supabase = getSupabaseClient()
  
  let query = supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
    .order('fecha_creacion', { ascending: false })

  if (filters?.category) {
    query = query.eq('categoria', filters.category)
  }

  if (filters?.featured) {
    query = query.eq('destacado', true)
  }

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data ?? []
}

export async function getProductBySlug(slug: string): Promise<Producto | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('slug', slug)
    .eq('activo', true)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return data
}

export async function getProductById(id: string): Promise<Producto | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching product:', error)
    return null
  }

  return data
}

export async function getFeaturedProducts(limit: number = 4): Promise<Producto[]> {
  return getProducts({ featured: true, limit })
}

export async function getProductsByCategory(category: CategoriaProducto): Promise<Producto[]> {
  return getProducts({ category })
}

/**
 * Search products by name or description.
 * Uses separate .ilike() filters to prevent PostgREST filter injection (C4 fix).
 */
export async function searchProducts(query: string): Promise<Producto[]> {
  const supabase = getSupabaseClient()

  // Sanitize the query: escape PostgREST special characters to prevent filter injection.
  // PostgREST uses commas and dots as filter operators — strip them.
  const sanitized = query.replace(/[%_,.*()]/g, '').trim()
  if (!sanitized) return []

  const pattern = `%${sanitized}%`

  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
    .or(`nombre.ilike.${pattern},descripcion.ilike.${pattern}`)
    .order('fecha_creacion', { ascending: false })

  if (error) {
    console.error('Error searching products:', error)
    return []
  }

  return data ?? []
}

// =============================================
// Funciones para admin
// =============================================

export async function getAllProducts(includeInactive: boolean = false): Promise<Producto[]> {
  const supabase = getSupabaseClient()
  
  let query = supabase
    .from('productos')
    .select('*')
    .order('fecha_creacion', { ascending: false })

  if (!includeInactive) {
    query = query.eq('activo', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching all products:', error)
    return []
  }

  return data ?? []
}

export async function createProduct(
  product: Omit<Producto, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>
): Promise<Producto | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('productos')
    .insert(product)
    .select()
    .single()

  if (error) {
    console.error('Error creating product:', error)
    return null
  }

  return data
}

export async function updateProduct(
  productId: string,
  updates: Partial<Omit<Producto, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>>
): Promise<Producto | null> {
  const supabase = getSupabaseClient()
  
  const { data, error } = await supabase
    .from('productos')
    .update(updates)
    .eq('id', productId)
    .select()
    .single()

  if (error) {
    console.error('Error updating product:', error)
    return null
  }

  return data
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  
  // Soft delete: marcar como inactivo
  const { error } = await supabase
    .from('productos')
    .update({ activo: false })
    .eq('id', productId)

  if (error) {
    console.error('Error deleting product:', error)
    return false
  }

  return true
}

export async function updateProductStock(
  productId: string,
  stock: Record<string, number>
): Promise<boolean> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase
    .from('productos')
    .update({ stock })
    .eq('id', productId)

  if (error) {
    console.error('Error updating stock:', error)
    return false
  }

  return true
}

// Aliases para compatibilidad
export type { Producto as Product, CategoriaProducto as ProductCategory }
