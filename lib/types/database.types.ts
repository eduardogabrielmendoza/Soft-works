// =============================================
// TIPOS DE BASE DE DATOS - SOFTWORKS E-COMMERCE
// Sincronizado con schema.sql en español
// =============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// =============================================
// TIPOS ENUM
// =============================================

export type RolUsuario = 'cliente' | 'admin'

export type EstadoPedido = 
  | 'pendiente_pago'
  | 'esperando_verificacion'
  | 'pago_aprobado'
  | 'pago_rechazado'
  | 'enviado'
  | 'entregado'
  | 'cancelado'

export type EstadoVerificacion = 'pendiente' | 'aprobado' | 'rechazado'

export type CategoriaProducto = 'camisetas' | 'hoodies' | 'gorras' | 'accesorios'

export type Transportista = 'correo_argentino' | 'andreani' | 'oca' | 'otro'

// =============================================
// INTERFACES DE TABLAS
// =============================================

export interface Perfil {
  id: string
  email: string
  nombre: string | null
  apellido: string | null
  telefono: string | null
  rol: RolUsuario
  avatar_url: string | null
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface Direccion {
  id: string
  usuario_id: string
  etiqueta: string
  nombre_destinatario: string
  calle: string
  numero: string
  piso_depto: string | null
  ciudad: string
  provincia: string
  codigo_postal: string
  pais: string
  telefono: string | null
  indicaciones: string | null
  es_predeterminada: boolean
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface Producto {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  precio: number
  precio_comparacion: number | null
  categoria: CategoriaProducto
  color: string | null
  caracteristicas: string[]
  tipo_guia_talles: string | null
  imagenes: ImagenProducto[]
  stock: Record<string, number>
  activo: boolean
  destacado: boolean
  meta_titulo: string | null
  meta_descripcion: string | null
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface ImagenProducto {
  src: string
  etiqueta: string
}

export interface CuentaBancaria {
  id: string
  banco: string
  titular: string
  cuit: string | null
  cbu: string
  alias: string | null
  tipo_cuenta: string
  activa: boolean
  orden_visualizacion: number
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface ZonaEnvio {
  id: string
  nombre: string
  provincias: string[]
  precio: number
  envio_gratis_minimo: number | null
  dias_estimados_min: number
  dias_estimados_max: number
  activa: boolean
  fecha_creacion: string
}

export interface Pedido {
  id: string
  numero_pedido: string
  usuario_id: string
  estado: EstadoPedido
  cliente_nombre: string | null
  cliente_email: string | null
  cliente_telefono: string | null
  direccion_envio: DireccionEnvioSnapshot
  subtotal: number
  costo_envio: number
  monto_descuento: number
  total: number
  notas_cliente: string | null
  notas_admin: string | null
  pagado_el: string | null
  enviado_el: string | null
  entregado_el: string | null
  cancelado_el: string | null
  motivo_cancelacion: string | null
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface DireccionEnvioSnapshot {
  nombre_destinatario: string
  calle: string
  numero: string
  piso_depto?: string
  ciudad: string
  provincia: string
  codigo_postal: string
  telefono?: string
}

export interface ItemPedido {
  id: string
  pedido_id: string
  producto_id: string | null
  producto_nombre: string
  producto_slug: string
  producto_imagen: string | null
  producto_precio: number
  talle: string
  cantidad: number
  total_linea: number
  fecha_creacion: string
}

export interface PedidoConItems extends Pedido {
  items: ItemPedido[]
  verificacion?: VerificacionPago | null
  envio?: InfoEnvio | null
}

export interface VerificacionPago {
  id: string
  pedido_id: string
  comprobante_url: string
  comprobante_nombre: string | null
  estado: EstadoVerificacion
  referencia_transferencia: string | null
  fecha_transferencia: string | null
  monto_transferido: number | null
  notas_cliente: string | null
  revisado_por: string | null
  revisado_el: string | null
  motivo_rechazo: string | null
  notas_admin: string | null
  enviado_el: string
  fecha_actualizacion: string
}

export interface InfoEnvio {
  id: string
  pedido_id: string
  numero_seguimiento: string | null
  transportista: Transportista
  nombre_transportista: string | null
  url_seguimiento: string | null
  entrega_estimada_min: string | null
  entrega_estimada_max: string | null
  enviado_el: string | null
  entregado_el: string | null
  notas: string | null
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface ItemCarrito {
  id: string
  usuario_id: string
  producto_id: string
  talle: string
  cantidad: number
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface ItemListaDeseos {
  id: string
  usuario_id: string
  producto_id: string
  fecha_creacion: string
}

export interface ConfiguracionTienda {
  id: string
  clave: string
  valor: Json
  descripcion: string | null
  fecha_actualizacion: string
  actualizado_por: string | null
}

export interface HistorialEstadoPedido {
  id: string
  pedido_id: string
  estado_anterior: EstadoPedido | null
  estado_nuevo: EstadoPedido
  cambiado_por: string | null
  notas: string | null
  fecha_creacion: string
}

export interface SuscriptorNewsletter {
  id: string
  email: string
  activo: boolean
  suscrito_el: string
  desuscrito_el: string | null
}

// =============================================
// TIPOS PARA CARRITO LOCAL (localStorage)
// =============================================

export interface ItemCarritoLocal {
  producto_id: string
  slug: string
  nombre: string
  imagen: string | null
  precio: number
  talle: string
  cantidad: number
}

// =============================================
// TIPOS LEGACY (para compatibilidad durante migración)
// =============================================

// Aliases en inglés para facilitar la transición
export type Profile = Perfil
export type Address = Direccion
export type Product = Producto
export type BankAccount = CuentaBancaria
export type ShippingZone = ZonaEnvio
export type Order = Pedido
export type OrderItem = ItemPedido
export type OrderWithItems = PedidoConItems
export type PaymentVerification = VerificacionPago
export type ShippingInfo = InfoEnvio
export type CartItem = ItemCarrito
export type WishlistItem = ItemListaDeseos
export type StoreSetting = ConfiguracionTienda
export type OrderStatusHistory = HistorialEstadoPedido
export type NewsletterSubscriber = SuscriptorNewsletter
export type LocalCartItem = ItemCarritoLocal

export type UserRole = RolUsuario
export type OrderStatus = EstadoPedido
export type VerificationStatus = EstadoVerificacion
export type ProductCategory = CategoriaProducto
export type ShippingCarrier = Transportista
export type ProductImage = ImagenProducto

// =============================================
// PROVINCIAS DE ARGENTINA
// =============================================

export const PROVINCIAS_ARGENTINA = [
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
] as const

export type ProvinciaArgentina = typeof PROVINCIAS_ARGENTINA[number]

// =============================================
// TIPO DATABASE (para Supabase client)
// =============================================

export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row: Perfil
        Insert: Omit<Perfil, 'fecha_creacion' | 'fecha_actualizacion'>
        Update: Partial<Omit<Perfil, 'id' | 'fecha_creacion'>>
      }
      direcciones: {
        Row: Direccion
        Insert: Omit<Direccion, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>
        Update: Partial<Omit<Direccion, 'id' | 'fecha_creacion'>>
      }
      productos: {
        Row: Producto
        Insert: Omit<Producto, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>
        Update: Partial<Omit<Producto, 'id' | 'fecha_creacion'>>
      }
      cuentas_bancarias: {
        Row: CuentaBancaria
        Insert: Omit<CuentaBancaria, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>
        Update: Partial<Omit<CuentaBancaria, 'id' | 'fecha_creacion'>>
      }
      zonas_envio: {
        Row: ZonaEnvio
        Insert: Omit<ZonaEnvio, 'id' | 'fecha_creacion'>
        Update: Partial<Omit<ZonaEnvio, 'id' | 'fecha_creacion'>>
      }
      pedidos: {
        Row: Pedido
        Insert: Omit<Pedido, 'id' | 'numero_pedido' | 'fecha_creacion' | 'fecha_actualizacion'>
        Update: Partial<Omit<Pedido, 'id' | 'numero_pedido' | 'fecha_creacion'>>
      }
      items_pedido: {
        Row: ItemPedido
        Insert: Omit<ItemPedido, 'id' | 'fecha_creacion'>
        Update: Partial<Omit<ItemPedido, 'id' | 'fecha_creacion'>>
      }
      verificaciones_pago: {
        Row: VerificacionPago
        Insert: Omit<VerificacionPago, 'id' | 'enviado_el' | 'fecha_actualizacion'>
        Update: Partial<Omit<VerificacionPago, 'id' | 'enviado_el'>>
      }
      info_envio: {
        Row: InfoEnvio
        Insert: Omit<InfoEnvio, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>
        Update: Partial<Omit<InfoEnvio, 'id' | 'fecha_creacion'>>
      }
      carrito_items: {
        Row: ItemCarrito
        Insert: Omit<ItemCarrito, 'id' | 'fecha_creacion' | 'fecha_actualizacion'>
        Update: Partial<Omit<ItemCarrito, 'id' | 'fecha_creacion'>>
      }
      lista_deseos: {
        Row: ItemListaDeseos
        Insert: Omit<ItemListaDeseos, 'id' | 'fecha_creacion'>
        Update: never
      }
      configuracion_tienda: {
        Row: ConfiguracionTienda
        Insert: Omit<ConfiguracionTienda, 'id' | 'fecha_actualizacion'>
        Update: Partial<Omit<ConfiguracionTienda, 'id'>>
      }
      historial_estados_pedido: {
        Row: HistorialEstadoPedido
        Insert: Omit<HistorialEstadoPedido, 'id' | 'fecha_creacion'>
        Update: never
      }
      suscriptores_newsletter: {
        Row: SuscriptorNewsletter
        Insert: Omit<SuscriptorNewsletter, 'id' | 'suscrito_el'>
        Update: Partial<Omit<SuscriptorNewsletter, 'id' | 'suscrito_el'>>
      }
    }
    Enums: {
      rol_usuario: RolUsuario
      estado_pedido: EstadoPedido
      estado_verificacion: EstadoVerificacion
      categoria_producto: CategoriaProducto
      transportista: Transportista
    }
  }
}
