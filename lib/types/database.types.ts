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
  | 'archivado'
  | 'finalizado'

export type EstadoVerificacion = 'pendiente' | 'aprobado' | 'rechazado'

export type CategoriaProducto = 'camisetas' | 'hoodies' | 'gorras' | 'accesorios'

export type Transportista = 'correo_argentino'

export type TipoEntrega = 'domicilio' | 'sucursal_correo'

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

export interface SucursalCorreoArgentino {
  id: string
  source_key: string
  provincia_codigo: string
  provincia_nombre: string
  normalized_province_name: string
  localidad_id: string
  localidad_nombre: string
  localidad_nombre_solicitada: string
  codigo_postal: string | null
  tipo_sucursal: string
  nombre: string
  direccion: string
  horarios: string | null
  latitud: number | null
  longitud: number | null
  service_ids: string[]
  service_names: string[]
  normalized_branch_name: string
  normalized_address: string
  normalized_locality_name: string
  normalized_search_text: string
  admite_recepcion_ecommerce: boolean
  admite_entrega_ecommerce: boolean
  admite_etienda: boolean
  es_elegible_envio_sucursal: boolean
  activa: boolean
  ultimo_scrapeo: string
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface SucursalCorreoSeleccionada {
  id: string
  source_key: string
  tipo_sucursal: string
  nombre: string
  direccion: string
  localidad_nombre: string
  provincia_nombre: string
  codigo_postal: string | null
  horarios?: string | null
  latitud?: number | null
  longitud?: number | null
  service_ids?: string[]
  service_names?: string[]
  es_elegible_envio_sucursal?: boolean
}

export interface CorreoArgentinoBranchSearchResult extends SucursalCorreoArgentino {
  score: number
  postal_code_match: boolean
  query_match: boolean
}

export interface CorreoArgentinoBranchSearchResponse {
  postalCode: string
  province: string | null
  query: string
  recommendation: CorreoArgentinoBranchSearchResult | null
  results: CorreoArgentinoBranchSearchResult[]
}

export type MetodoPago = 'transferencia' | 'mercadopago'

export interface Pedido {
  id: string
  numero_pedido: string
  usuario_id: string | null
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
  metodo_pago: MetodoPago
  mp_preference_id: string | null
  mp_payment_id: string | null
  fecha_creacion: string
  fecha_actualizacion: string
}

export interface DireccionEnvioSnapshot {
  tipo_entrega?: TipoEntrega
  nombre_destinatario: string
  calle: string
  numero: string
  piso_depto?: string
  ciudad: string
  provincia: string
  codigo_postal: string
  telefono?: string
  sucursal_correo?: SucursalCorreoSeleccionada
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
export type CorreoArgentinoBranch = SucursalCorreoArgentino
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
        Insert: Partial<Perfil> & Pick<Perfil, 'id' | 'email'>
        Update: Partial<Perfil>
        Relationships: []
      }
      direcciones: {
        Row: Direccion
        Insert: Partial<Direccion> & Pick<Direccion, 'usuario_id' | 'nombre_destinatario' | 'calle' | 'numero' | 'ciudad' | 'provincia' | 'codigo_postal' | 'pais'>
        Update: Partial<Direccion>
        Relationships: [{ foreignKeyName: 'direcciones_usuario_id_fkey'; columns: ['usuario_id']; referencedRelation: 'perfiles'; referencedColumns: ['id'] }]
      }
      productos: {
        Row: Producto
        Insert: Partial<Producto> & Pick<Producto, 'nombre' | 'slug' | 'precio' | 'categoria'>
        Update: Partial<Producto>
        Relationships: []
      }
      cuentas_bancarias: {
        Row: CuentaBancaria
        Insert: Partial<CuentaBancaria> & Pick<CuentaBancaria, 'banco' | 'titular' | 'cbu' | 'tipo_cuenta'>
        Update: Partial<CuentaBancaria>
        Relationships: []
      }
      zonas_envio: {
        Row: ZonaEnvio
        Insert: Partial<ZonaEnvio> & Pick<ZonaEnvio, 'nombre' | 'provincias' | 'precio'>
        Update: Partial<ZonaEnvio>
        Relationships: []
      }
      pedidos: {
        Row: Pedido
        Insert: Partial<Pedido> & Pick<Pedido, 'estado' | 'subtotal' | 'total' | 'costo_envio' | 'direccion_envio' | 'metodo_pago'>
        Update: Partial<Pedido>
        Relationships: [{ foreignKeyName: 'pedidos_usuario_id_fkey'; columns: ['usuario_id']; referencedRelation: 'perfiles'; referencedColumns: ['id'] }]
      }
      items_pedido: {
        Row: ItemPedido
        Insert: Partial<ItemPedido> & Pick<ItemPedido, 'pedido_id' | 'producto_nombre' | 'producto_precio' | 'talle' | 'cantidad' | 'total_linea'>
        Update: Partial<ItemPedido>
        Relationships: [{ foreignKeyName: 'items_pedido_pedido_id_fkey'; columns: ['pedido_id']; referencedRelation: 'pedidos'; referencedColumns: ['id'] }]
      }
      verificaciones_pago: {
        Row: VerificacionPago
        Insert: Partial<VerificacionPago> & Pick<VerificacionPago, 'pedido_id' | 'comprobante_url' | 'estado'>
        Update: Partial<VerificacionPago>
        Relationships: [{ foreignKeyName: 'verificaciones_pago_pedido_id_fkey'; columns: ['pedido_id']; referencedRelation: 'pedidos'; referencedColumns: ['id'] }]
      }
      info_envio: {
        Row: InfoEnvio
        Insert: Partial<InfoEnvio> & Pick<InfoEnvio, 'pedido_id'>
        Update: Partial<InfoEnvio>
        Relationships: [{ foreignKeyName: 'info_envio_pedido_id_fkey'; columns: ['pedido_id']; referencedRelation: 'pedidos'; referencedColumns: ['id'] }]
      }
      sucursales_correo_argentino: {
        Row: SucursalCorreoArgentino
        Insert: Partial<SucursalCorreoArgentino> & Pick<SucursalCorreoArgentino, 'source_key' | 'nombre' | 'direccion'>
        Update: Partial<SucursalCorreoArgentino>
        Relationships: []
      }
      carrito_items: {
        Row: ItemCarrito
        Insert: Partial<ItemCarrito> & Pick<ItemCarrito, 'usuario_id' | 'producto_id' | 'talle' | 'cantidad'>
        Update: Partial<ItemCarrito>
        Relationships: []
      }
      lista_deseos: {
        Row: ItemListaDeseos
        Insert: Partial<ItemListaDeseos> & Pick<ItemListaDeseos, 'usuario_id' | 'producto_id'>
        Update: never
        Relationships: []
      }
      configuracion_tienda: {
        Row: ConfiguracionTienda
        Insert: Partial<ConfiguracionTienda> & Pick<ConfiguracionTienda, 'clave' | 'valor'>
        Update: Partial<ConfiguracionTienda>
        Relationships: []
      }
      historial_estados_pedido: {
        Row: HistorialEstadoPedido
        Insert: Partial<HistorialEstadoPedido> & Pick<HistorialEstadoPedido, 'pedido_id' | 'estado_anterior' | 'estado_nuevo'>
        Update: never
        Relationships: []
      }
      suscriptores_newsletter: {
        Row: SuscriptorNewsletter
        Insert: Partial<SuscriptorNewsletter> & Pick<SuscriptorNewsletter, 'email'>
        Update: Partial<SuscriptorNewsletter>
        Relationships: []
      }
      configuracion_sitio: {
        Row: { id: string; clave: string; valor: Json; fecha_actualizacion: string }
        Insert: { clave: string; valor: Json }
        Update: Partial<{ clave: string; valor: Json }>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      generar_numero_pedido: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: {
      rol_usuario: RolUsuario
      estado_pedido: EstadoPedido
      estado_verificacion: EstadoVerificacion
      categoria_producto: CategoriaProducto
      transportista: Transportista
    }
    CompositeTypes: Record<string, never>
  }
}


