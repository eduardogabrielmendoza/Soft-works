import { getSupabaseClient } from '@/lib/supabase/client'

const BUCKET_NAME = 'receipts'

export async function uploadReceipt(
  file: File,
  orderId: string
): Promise<{ url: string; filename: string }> {
  // Obtener cliente con la sesión actual del usuario
  const supabase = getSupabaseClient()
  
  // Generar nombre único para el archivo
  const fileExt = file.name.split('.').pop()
  const fileName = `${orderId}/${Date.now()}.${fileExt}`

  // Subir archivo
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.error('Upload error details:', uploadError)
    throw new Error(`Error uploading file: ${uploadError.message}`)
  }

  // Obtener URL pública
  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName)

  return {
    url: publicUrl,
    filename: file.name
  }
}

export async function deleteReceipt(filePath: string): Promise<void> {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath])

  if (error) {
    throw new Error(`Error deleting file: ${error.message}`)
  }
}

// Para subir imágenes de productos (admin)
export async function uploadProductImage(
  file: File,
  productSlug: string
): Promise<string> {
  const supabase = getSupabaseClient()
  
  const fileExt = file.name.split('.').pop()
  const fileName = `products/${productSlug}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('products')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    throw new Error(`Error uploading product image: ${uploadError.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from('products')
    .getPublicUrl(fileName)

  return publicUrl
}
