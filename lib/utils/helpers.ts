import type { EstadoPedido } from '@/lib/types/database.types'

// Formatear precio en pesos argentinos
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

// Formatear fecha
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options
  }).format(dateObj)
}

// Formatear fecha y hora
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

// Obtener etiqueta del estado de orden
export function getOrderStatusLabel(status: EstadoPedido): string {
  const labels: Record<EstadoPedido, string> = {
    pendiente_pago: 'Pendiente de Pago',
    esperando_verificacion: 'Verificando Pago',
    pago_aprobado: 'Pago Aprobado',
    pago_rechazado: 'Pago Rechazado',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
    archivado: 'Archivado'
  }
  return labels[status] || status
}

// Obtener color del estado de orden
export function getOrderStatusColor(status: EstadoPedido): string {
  const colors: Record<EstadoPedido, string> = {
    pendiente_pago: 'bg-yellow-100 text-yellow-800',
    esperando_verificacion: 'bg-blue-100 text-blue-800',
    pago_aprobado: 'bg-green-100 text-green-800',
    pago_rechazado: 'bg-red-100 text-red-800',
    enviado: 'bg-purple-100 text-purple-800',
    entregado: 'bg-gray-100 text-gray-800',
    cancelado: 'bg-red-100 text-red-800',
    archivado: 'bg-amber-100 text-amber-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

// Validar email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validar CBU
export function isValidCBU(cbu: string): boolean {
  const cleanCBU = cbu.replace(/\s/g, '')
  return /^\d{22}$/.test(cleanCBU)
}

// Generar slug desde texto
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Truncar texto
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

// Calcular porcentaje de descuento
export function calculateDiscountPercentage(originalPrice: number, currentPrice: number): number {
  if (originalPrice <= 0) return 0
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
}

// Verificar si hay stock disponible
export function hasStockForSize(
  stock: Record<string, number | undefined>,
  size: string,
  quantity: number = 1
): boolean {
  const available = stock[size] || 0
  return available >= quantity
}

// Obtener tallas disponibles con stock
export function getAvailableSizes(stock: Record<string, number | undefined>): string[] {
  return Object.entries(stock)
    .filter(([_, qty]) => (qty || 0) > 0)
    .map(([size]) => size)
}

// Formatear número de teléfono argentino
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

// Copiar al portapapeles
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Delay helper
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Debounce function
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

// Capitalize primera letra
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Pluralizar
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`)
}
