-- =============================================
-- SOFTWORKS E-COMMERCE - ESQUEMA DE BASE DE DATOS
-- Supabase PostgreSQL
-- Versión en Español
-- =============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TIPOS ENUM
-- =============================================

-- Roles de usuario
CREATE TYPE rol_usuario AS ENUM ('cliente', 'admin');

-- Estados de pedido
CREATE TYPE estado_pedido AS ENUM (
  'pendiente_pago',         -- Esperando que el usuario haga la transferencia
  'esperando_verificacion', -- Comprobante subido, esperando revisión
  'pago_aprobado',          -- Pago aprobado, preparando envío
  'pago_rechazado',         -- Pago rechazado
  'enviado',                -- Enviado
  'entregado',              -- Entregado
  'cancelado'               -- Cancelado
);

-- Estados de verificación de pago
CREATE TYPE estado_verificacion AS ENUM ('pendiente', 'aprobado', 'rechazado');

-- Categorías de productos
CREATE TYPE categoria_producto AS ENUM ('camisetas', 'hoodies', 'gorras', 'accesorios');

-- Transportistas de envío
CREATE TYPE transportista AS ENUM ('correo_argentino', 'andreani', 'oca', 'otro');

-- =============================================
-- TABLA: perfiles (Extensión de auth.users)
-- =============================================
CREATE TABLE perfiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre TEXT,
  apellido TEXT,
  telefono TEXT,
  rol rol_usuario DEFAULT 'cliente' NOT NULL,
  avatar_url TEXT,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX idx_perfiles_email ON perfiles(email);
CREATE INDEX idx_perfiles_rol ON perfiles(rol);

-- =============================================
-- TABLA: direcciones (Direcciones de envío)
-- =============================================
CREATE TABLE direcciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  etiqueta TEXT DEFAULT 'Casa',  -- Ej: "Casa", "Trabajo", etc.
  nombre_destinatario TEXT NOT NULL,
  calle TEXT NOT NULL,
  numero TEXT NOT NULL,
  piso_depto TEXT,  -- Piso/Depto (opcional)
  ciudad TEXT NOT NULL,
  provincia TEXT NOT NULL,
  codigo_postal TEXT NOT NULL,
  pais TEXT DEFAULT 'Argentina' NOT NULL,
  telefono TEXT,
  indicaciones TEXT,  -- Referencias, instrucciones de entrega
  es_predeterminada BOOLEAN DEFAULT FALSE,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX idx_direcciones_usuario ON direcciones(usuario_id);
CREATE INDEX idx_direcciones_predeterminada ON direcciones(usuario_id, es_predeterminada);

-- =============================================
-- TABLA: productos (Catálogo de productos)
-- =============================================
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  precio_comparacion DECIMAL(10,2),  -- Precio anterior (para mostrar descuentos)
  categoria categoria_producto NOT NULL,
  color TEXT,
  caracteristicas JSONB DEFAULT '[]'::jsonb,  -- Array de características
  tipo_guia_talles TEXT,  -- 'mujer', 'varon', 'hoodie', 'gorra'
  imagenes JSONB DEFAULT '[]'::jsonb,  -- [{src: '', etiqueta: ''}]
  stock JSONB DEFAULT '{}'::jsonb,  -- {XS: 10, S: 15, M: 20, L: 10, XL: 5}
  activo BOOLEAN DEFAULT TRUE,
  destacado BOOLEAN DEFAULT FALSE,
  meta_titulo TEXT,
  meta_descripcion TEXT,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX idx_productos_slug ON productos(slug);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_productos_destacado ON productos(destacado) WHERE destacado = TRUE;

-- =============================================
-- TABLA: cuentas_bancarias (Cuentas para transferencias)
-- =============================================
CREATE TABLE cuentas_bancarias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  banco TEXT NOT NULL,
  titular TEXT NOT NULL,
  cuit TEXT,
  cbu TEXT NOT NULL,
  alias TEXT,
  tipo_cuenta TEXT DEFAULT 'Cuenta Corriente',
  activa BOOLEAN DEFAULT TRUE,
  orden_visualizacion INT DEFAULT 0,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- TABLA: zonas_envio (Zonas de envío con costos)
-- =============================================
CREATE TABLE zonas_envio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,  -- Ej: "CABA", "GBA Norte", "Patagonia"
  provincias JSONB DEFAULT '[]'::jsonb,  -- Array de provincias incluidas
  precio DECIMAL(10,2) NOT NULL DEFAULT 0,
  envio_gratis_minimo DECIMAL(10,2),  -- Monto para envío gratis
  dias_estimados_min INT DEFAULT 3,
  dias_estimados_max INT DEFAULT 7,
  activa BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- TABLA: pedidos (Pedidos)
-- =============================================
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero_pedido TEXT UNIQUE NOT NULL,  -- SW-20260120-XXXX
  usuario_id UUID NOT NULL REFERENCES perfiles(id),
  estado estado_pedido DEFAULT 'pendiente_pago' NOT NULL,
  
  -- Información del cliente (snapshot)
  cliente_nombre TEXT,
  cliente_email TEXT,
  cliente_telefono TEXT,
  
  -- Snapshot de dirección (no FK para preservar historial)
  direccion_envio JSONB NOT NULL,
  
  -- Totales
  subtotal DECIMAL(10,2) NOT NULL,
  costo_envio DECIMAL(10,2) DEFAULT 0,
  monto_descuento DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Información adicional
  notas_cliente TEXT,  -- Notas del cliente
  notas_admin TEXT,    -- Notas internas del admin
  
  -- Timestamps importantes
  pagado_el TIMESTAMPTZ,
  enviado_el TIMESTAMPTZ,
  entregado_el TIMESTAMPTZ,
  cancelado_el TIMESTAMPTZ,
  motivo_cancelacion TEXT,
  
  fecha_creacion TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha_creacion DESC);

-- =============================================
-- TABLA: items_pedido (Items del pedido)
-- =============================================
CREATE TABLE items_pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  
  -- Snapshot del producto al momento de la compra
  producto_nombre TEXT NOT NULL,
  producto_slug TEXT NOT NULL,
  producto_imagen TEXT,
  producto_precio DECIMAL(10,2) NOT NULL,
  
  talle TEXT NOT NULL,
  cantidad INT NOT NULL CHECK (cantidad > 0),
  total_linea DECIMAL(10,2) NOT NULL,
  
  fecha_creacion TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX idx_items_pedido_pedido ON items_pedido(pedido_id);
CREATE INDEX idx_items_pedido_producto ON items_pedido(producto_id);

-- =============================================
-- TABLA: verificaciones_pago (Comprobantes de pago)
-- =============================================
CREATE TABLE verificaciones_pago (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  
  -- Archivo del comprobante
  comprobante_url TEXT NOT NULL,
  comprobante_nombre TEXT,
  
  -- Estado de verificación
  estado estado_verificacion DEFAULT 'pendiente' NOT NULL,
  
  -- Información adicional del usuario
  referencia_transferencia TEXT,  -- Referencia/número de operación
  fecha_transferencia DATE,       -- Fecha de la transferencia
  monto_transferido DECIMAL(10,2),  -- Monto transferido
  notas_cliente TEXT,
  
  -- Revisión del admin
  revisado_por UUID REFERENCES perfiles(id),
  revisado_el TIMESTAMPTZ,
  motivo_rechazo TEXT,
  notas_admin TEXT,
  
  enviado_el TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices
CREATE INDEX idx_verificaciones_pedido ON verificaciones_pago(pedido_id);
CREATE INDEX idx_verificaciones_estado ON verificaciones_pago(estado);
CREATE INDEX idx_verificaciones_pendientes ON verificaciones_pago(estado) WHERE estado = 'pendiente';

-- =============================================
-- TABLA: info_envio (Info de envío post-aprobación)
-- =============================================
CREATE TABLE info_envio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID UNIQUE NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  
  numero_seguimiento TEXT,
  transportista transportista DEFAULT 'correo_argentino',
  nombre_transportista TEXT,  -- Nombre personalizado si transportista = 'otro'
  url_seguimiento TEXT,
  
  entrega_estimada_min DATE,
  entrega_estimada_max DATE,
  
  enviado_el TIMESTAMPTZ,
  entregado_el TIMESTAMPTZ,
  
  notas TEXT,  -- Notas sobre el envío
  
  fecha_creacion TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índice
CREATE INDEX idx_info_envio_pedido ON info_envio(pedido_id);

-- =============================================
-- TABLA: carrito_items (Carrito persistente - opcional)
-- =============================================
CREATE TABLE carrito_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  talle TEXT NOT NULL,
  cantidad INT NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  fecha_creacion TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(usuario_id, producto_id, talle)
);

-- Índice
CREATE INDEX idx_carrito_usuario ON carrito_items(usuario_id);

-- =============================================
-- TABLA: lista_deseos (Lista de deseos)
-- =============================================
CREATE TABLE lista_deseos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(usuario_id, producto_id)
);

-- Índice
CREATE INDEX idx_lista_deseos_usuario ON lista_deseos(usuario_id);

-- =============================================
-- TABLA: configuracion_tienda (Configuración general)
-- =============================================
CREATE TABLE configuracion_tienda (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave TEXT UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descripcion TEXT,
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  actualizado_por UUID REFERENCES perfiles(id)
);

-- Insertar configuraciones iniciales
INSERT INTO configuracion_tienda (clave, valor, descripcion) VALUES
  ('nombre_tienda', '"Softworks"', 'Nombre de la tienda'),
  ('email_tienda', '"hola@softworks.com"', 'Email principal'),
  ('telefono_tienda', '"+54 11 1234-5678"', 'Teléfono de contacto'),
  ('moneda', '"ARS"', 'Moneda'),
  ('simbolo_moneda', '"$"', 'Símbolo de moneda'),
  ('envio_gratis_minimo', '100000', 'Monto mínimo para envío gratis'),
  ('pedidos_habilitados', 'true', 'Habilitar/deshabilitar pedidos'),
  ('modo_mantenimiento', 'false', 'Modo mantenimiento'),
  ('instagram_url', '"https://instagram.com/softworks"', 'URL de Instagram'),
  ('whatsapp_numero', '"+5491112345678"', 'Número de WhatsApp');

-- =============================================
-- TABLA: historial_estados_pedido (Historial de estados)
-- =============================================
CREATE TABLE historial_estados_pedido (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  estado_anterior estado_pedido,
  estado_nuevo estado_pedido NOT NULL,
  cambiado_por UUID REFERENCES perfiles(id),
  notas TEXT,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índice
CREATE INDEX idx_historial_estados_pedido ON historial_estados_pedido(pedido_id);

-- =============================================
-- TABLA: suscriptores_newsletter
-- =============================================
CREATE TABLE suscriptores_newsletter (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  suscrito_el TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  desuscrito_el TIMESTAMPTZ
);

-- Índice
CREATE INDEX idx_newsletter_email ON suscriptores_newsletter(email);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas con fecha_actualizacion
CREATE TRIGGER actualizar_perfiles_fecha BEFORE UPDATE ON perfiles
  FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER actualizar_direcciones_fecha BEFORE UPDATE ON direcciones
  FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER actualizar_productos_fecha BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER actualizar_pedidos_fecha BEFORE UPDATE ON pedidos
  FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER actualizar_verificaciones_fecha BEFORE UPDATE ON verificaciones_pago
  FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER actualizar_info_envio_fecha BEFORE UPDATE ON info_envio
  FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER actualizar_carrito_fecha BEFORE UPDATE ON carrito_items
  FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();

CREATE TRIGGER actualizar_cuentas_bancarias_fecha BEFORE UPDATE ON cuentas_bancarias
  FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- Función para generar número de pedido
CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS TRIGGER AS $$
DECLARE
  cantidad_hoy INT;
  fecha_hoy TEXT;
BEGIN
  fecha_hoy := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT COUNT(*) + 1 INTO cantidad_hoy
  FROM pedidos
  WHERE numero_pedido LIKE 'SW-' || fecha_hoy || '-%';
  
  NEW.numero_pedido := 'SW-' || fecha_hoy || '-' || LPAD(cantidad_hoy::TEXT, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generar_numero_pedido
  BEFORE INSERT ON pedidos
  FOR EACH ROW
  WHEN (NEW.numero_pedido IS NULL)
  EXECUTE FUNCTION generar_numero_pedido();

-- Función para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION manejar_nuevo_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, nombre, apellido)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'nombre'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'apellido')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_nuevo_usuario
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION manejar_nuevo_usuario();

-- Función para registrar cambios de estado de pedido
CREATE OR REPLACE FUNCTION registrar_cambio_estado_pedido()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO historial_estados_pedido (pedido_id, estado_anterior, estado_nuevo)
    VALUES (NEW.id, OLD.estado, NEW.estado);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cambio_estado_pedido
  AFTER UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION registrar_cambio_estado_pedido();

-- Función para asegurar solo una dirección predeterminada por usuario
CREATE OR REPLACE FUNCTION asegurar_direccion_unica_predeterminada()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.es_predeterminada = TRUE THEN
    UPDATE direcciones 
    SET es_predeterminada = FALSE 
    WHERE usuario_id = NEW.usuario_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_direccion_predeterminada
  AFTER INSERT OR UPDATE ON direcciones
  FOR EACH ROW
  WHEN (NEW.es_predeterminada = TRUE)
  EXECUTE FUNCTION asegurar_direccion_unica_predeterminada();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE direcciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE items_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE verificaciones_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE info_envio ENABLE ROW LEVEL SECURITY;
ALTER TABLE carrito_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lista_deseos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuentas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas_envio ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_tienda ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_estados_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE suscriptores_newsletter ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS: perfiles
-- =============================================
CREATE POLICY "Usuarios pueden ver su perfil"
  ON perfiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuarios pueden insertar su perfil"
  ON perfiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Usuarios pueden actualizar su perfil"
  ON perfiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND rol = 'cliente');

CREATE POLICY "Admins pueden ver todos los perfiles"
  ON perfiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "Admins pueden actualizar todos los perfiles"
  ON perfiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- =============================================
-- POLÍTICAS RLS: direcciones
-- =============================================
CREATE POLICY "Usuarios pueden gestionar sus direcciones"
  ON direcciones FOR ALL
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Admins pueden ver todas las direcciones"
  ON direcciones FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- =============================================
-- POLÍTICAS RLS: productos
-- =============================================
CREATE POLICY "Cualquiera puede ver productos activos"
  ON productos FOR SELECT
  USING (activo = TRUE);

CREATE POLICY "Admins pueden gestionar todos los productos"
  ON productos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- =============================================
-- POLÍTICAS RLS: pedidos
-- =============================================
CREATE POLICY "Usuarios pueden ver sus pedidos"
  ON pedidos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden crear sus pedidos"
  ON pedidos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden actualizar pedidos pendientes"
  ON pedidos FOR UPDATE
  USING (auth.uid() = usuario_id AND estado IN ('pendiente_pago', 'esperando_verificacion'))
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Admins pueden gestionar todos los pedidos"
  ON pedidos FOR ALL
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- =============================================
-- POLÍTICAS RLS: items_pedido
-- =============================================
CREATE POLICY "Usuarios pueden ver items de sus pedidos"
  ON items_pedido FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM pedidos WHERE pedidos.id = items_pedido.pedido_id AND pedidos.usuario_id = auth.uid())
  );

CREATE POLICY "Usuarios pueden crear items en sus pedidos"
  ON items_pedido FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM pedidos WHERE pedidos.id = items_pedido.pedido_id AND pedidos.usuario_id = auth.uid())
  );

CREATE POLICY "Admins pueden gestionar todos los items"
  ON items_pedido FOR ALL
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- =============================================
-- POLÍTICAS RLS: verificaciones_pago
-- =============================================
CREATE POLICY "Usuarios pueden ver sus verificaciones"
  ON verificaciones_pago FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM pedidos WHERE pedidos.id = verificaciones_pago.pedido_id AND pedidos.usuario_id = auth.uid())
  );

CREATE POLICY "Usuarios pueden crear verificaciones de sus pedidos"
  ON verificaciones_pago FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM pedidos WHERE pedidos.id = verificaciones_pago.pedido_id AND pedidos.usuario_id = auth.uid())
  );

CREATE POLICY "Admins pueden gestionar todas las verificaciones"
  ON verificaciones_pago FOR ALL
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- =============================================
-- POLÍTICAS RLS: info_envio
-- =============================================
CREATE POLICY "Usuarios pueden ver info de envío de sus pedidos"
  ON info_envio FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM pedidos WHERE pedidos.id = info_envio.pedido_id AND pedidos.usuario_id = auth.uid())
  );

CREATE POLICY "Admins pueden gestionar toda la info de envío"
  ON info_envio FOR ALL
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- =============================================
-- POLÍTICAS RLS: carrito_items
-- =============================================
CREATE POLICY "Usuarios pueden gestionar su carrito"
  ON carrito_items FOR ALL
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- =============================================
-- POLÍTICAS RLS: lista_deseos
-- =============================================
CREATE POLICY "Usuarios pueden gestionar su lista de deseos"
  ON lista_deseos FOR ALL
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- =============================================
-- POLÍTICAS RLS: cuentas_bancarias
-- =============================================
CREATE POLICY "Cualquiera puede ver cuentas bancarias activas"
  ON cuentas_bancarias FOR SELECT
  USING (activa = TRUE);

CREATE POLICY "Admins pueden gestionar cuentas bancarias"
  ON cuentas_bancarias FOR ALL
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- =============================================
-- POLÍTICAS RLS: zonas_envio
-- =============================================
CREATE POLICY "Cualquiera puede ver zonas de envío activas"
  ON zonas_envio FOR SELECT
  USING (activa = TRUE);

CREATE POLICY "Admins pueden gestionar zonas de envío"
  ON zonas_envio FOR ALL
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- =============================================
-- POLÍTICAS RLS: configuracion_tienda
-- =============================================
CREATE POLICY "Cualquiera puede ver configuración"
  ON configuracion_tienda FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins pueden gestionar configuración"
  ON configuracion_tienda FOR ALL
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- =============================================
-- POLÍTICAS RLS: historial_estados_pedido
-- =============================================
CREATE POLICY "Usuarios pueden ver historial de sus pedidos"
  ON historial_estados_pedido FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM pedidos WHERE pedidos.id = historial_estados_pedido.pedido_id AND pedidos.usuario_id = auth.uid())
  );

CREATE POLICY "Admins pueden ver todo el historial"
  ON historial_estados_pedido FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- =============================================
-- POLÍTICAS RLS: suscriptores_newsletter
-- =============================================
CREATE POLICY "Cualquiera puede suscribirse al newsletter"
  ON suscriptores_newsletter FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admins pueden gestionar newsletter"
  ON suscriptores_newsletter FOR ALL
  USING (
    EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin')
  );

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Cuenta bancaria de ejemplo
INSERT INTO cuentas_bancarias (banco, titular, cuit, cbu, alias, tipo_cuenta, activa) VALUES
  ('Banco Santander', 'SOFTWORKS SRL', '30-71234567-9', '0720000000000000000000', 'SOFTWORKS.TIENDA', 'Cuenta Corriente', TRUE);

-- =============================================
-- ZONAS DE ENVÍO - TODAS LAS PROVINCIAS DE ARGENTINA
-- =============================================

-- CABA
INSERT INTO zonas_envio (nombre, provincias, precio, envio_gratis_minimo, dias_estimados_min, dias_estimados_max, activa) VALUES
  ('CABA', '["Ciudad Autónoma de Buenos Aires"]', 3500, 100000, 1, 3, TRUE);

-- GBA (Gran Buenos Aires)
INSERT INTO zonas_envio (nombre, provincias, precio, envio_gratis_minimo, dias_estimados_min, dias_estimados_max, activa) VALUES
  ('Gran Buenos Aires', '["Buenos Aires - GBA Norte", "Buenos Aires - GBA Sur", "Buenos Aires - GBA Oeste"]', 4000, 100000, 2, 4, TRUE);

-- Interior Buenos Aires
INSERT INTO zonas_envio (nombre, provincias, precio, envio_gratis_minimo, dias_estimados_min, dias_estimados_max, activa) VALUES
  ('Interior Buenos Aires', '["Buenos Aires"]', 5000, 120000, 3, 5, TRUE);

-- Zona Centro (Córdoba, Santa Fe, Entre Ríos)
INSERT INTO zonas_envio (nombre, provincias, precio, envio_gratis_minimo, dias_estimados_min, dias_estimados_max, activa) VALUES
  ('Zona Centro', '["Córdoba", "Santa Fe", "Entre Ríos"]', 5500, 120000, 3, 6, TRUE);

-- Zona Cuyo (Mendoza, San Juan, San Luis, La Rioja)
INSERT INTO zonas_envio (nombre, provincias, precio, envio_gratis_minimo, dias_estimados_min, dias_estimados_max, activa) VALUES
  ('Zona Cuyo', '["Mendoza", "San Juan", "San Luis", "La Rioja"]', 6000, 130000, 4, 7, TRUE);

-- Zona NOA (Noroeste Argentino)
INSERT INTO zonas_envio (nombre, provincias, precio, envio_gratis_minimo, dias_estimados_min, dias_estimados_max, activa) VALUES
  ('Zona NOA', '["Tucumán", "Salta", "Jujuy", "Santiago del Estero", "Catamarca"]', 6500, 140000, 5, 8, TRUE);

-- Zona NEA (Noreste Argentino)
INSERT INTO zonas_envio (nombre, provincias, precio, envio_gratis_minimo, dias_estimados_min, dias_estimados_max, activa) VALUES
  ('Zona NEA', '["Misiones", "Corrientes", "Chaco", "Formosa"]', 6500, 140000, 5, 8, TRUE);

-- Zona Patagonia Norte
INSERT INTO zonas_envio (nombre, provincias, precio, envio_gratis_minimo, dias_estimados_min, dias_estimados_max, activa) VALUES
  ('Patagonia Norte', '["La Pampa", "Neuquén", "Río Negro"]', 7000, 150000, 5, 9, TRUE);

-- Zona Patagonia Sur
INSERT INTO zonas_envio (nombre, provincias, precio, envio_gratis_minimo, dias_estimados_min, dias_estimados_max, activa) VALUES
  ('Patagonia Sur', '["Chubut", "Santa Cruz", "Tierra del Fuego"]', 8500, 180000, 7, 12, TRUE);

-- =============================================
-- PRODUCTOS INICIALES
-- =============================================
INSERT INTO productos (nombre, slug, descripcion, precio, categoria, color, caracteristicas, tipo_guia_talles, imagenes, stock, activo, destacado) VALUES
  (
    'Camiseta Monkey 01',
    'camiseta-monkey-01',
    'Nuestra camiseta Monkey 01 está confeccionada con algodón orgánico premium. Diseño atemporal y corte perfecto para el uso diario.',
    30000,
    'camisetas',
    'blanco',
    '["100% Algodón Orgánico", "Corte regular", "Cuello redondo", "Fabricado en Argentina"]',
    'mujer',
    '[{"src": "/images/colecciones/camisetablancafrontal.png", "etiqueta": "Frontal"}, {"src": "/images/colecciones/camisetablancadorsal.png", "etiqueta": "Trasera"}]',
    '{"XS": 10, "S": 15, "M": 20, "L": 15, "XL": 10}',
    TRUE,
    TRUE
  ),
  (
    'Camiseta Monkey 02',
    'camiseta-monkey-02',
    'Camiseta Monkey 02 en color negro, confeccionada con algodón premium de alta calidad. Diseño exclusivo y acabado perfecto.',
    40000,
    'camisetas',
    'negro',
    '["100% Algodón Premium", "Corte regular", "Cuello redondo", "Fabricado en Argentina"]',
    'varon',
    '[{"src": "/images/colecciones/camisetanegrafrontal.png", "etiqueta": "Frontal"}, {"src": "/images/colecciones/camisetanegradorsal.png", "etiqueta": "Trasera"}]',
    '{"XS": 8, "S": 12, "M": 18, "L": 12, "XL": 8}',
    TRUE,
    TRUE
  ),
  (
    'Camiseta Monkey 03',
    'camiseta-monkey-03',
    'Camiseta Monkey 03 en tono verde, perfecta para un look casual y relajado. Confeccionada con materiales de primera calidad.',
    30000,
    'camisetas',
    'verde',
    '["100% Algodón Orgánico", "Corte regular", "Cuello redondo", "Fabricado en Argentina"]',
    'varon',
    '[{"src": "/images/colecciones/camisetagreenfrontal.png", "etiqueta": "Frontal"}, {"src": "/images/colecciones/camisetagreendorsal.png", "etiqueta": "Trasera"}]',
    '{"XS": 5, "S": 10, "M": 15, "L": 10, "XL": 5}',
    TRUE,
    FALSE
  ),
  (
    'Hoodie Smoking Billy',
    'hoodie-smoking-billy',
    'Hoodie Smoking Billy de diseño único y estilo urbano. Comodidad y calidez en una prenda esencial para tu guardarropa.',
    40000,
    'hoodies',
    'blanco',
    '["80% Algodón / 20% Poliéster", "Capucha ajustable", "Bolsillo canguro", "Fabricado en Argentina"]',
    'hoodie',
    '[{"src": "/images/colecciones/hoodiefrontal.png", "etiqueta": "Frontal"}, {"src": "/images/colecciones/hoodiedorsal.png", "etiqueta": "Trasera"}, {"src": "/images/colecciones/hoodielateral.png", "etiqueta": "Lateral"}]',
    '{"XS": 5, "S": 8, "M": 12, "L": 8, "XL": 5}',
    TRUE,
    TRUE
  ),
  (
    'Gorra Obsessed',
    'gorra-obsessed',
    'Gorra Obsessed con diseño minimalista y ajuste perfecto. El complemento ideal para completar cualquier outfit.',
    25000,
    'gorras',
    'blanco',
    '["100% Algodón", "Ajuste regulable", "Visera curva", "Logo bordado"]',
    'gorra',
    '[{"src": "/images/colecciones/capfrente.png", "etiqueta": "Frontal"}, {"src": "/images/colecciones/capdorsal.png", "etiqueta": "Trasera"}, {"src": "/images/colecciones/caplateral.png", "etiqueta": "Lateral"}]',
    '{"Único": 50}',
    TRUE,
    FALSE
  );

-- =============================================
-- LISTA COMPLETA DE PROVINCIAS ARGENTINAS (para referencia)
-- =============================================
-- 1. Ciudad Autónoma de Buenos Aires (CABA)
-- 2. Buenos Aires
-- 3. Catamarca
-- 4. Chaco
-- 5. Chubut
-- 6. Córdoba
-- 7. Corrientes
-- 8. Entre Ríos
-- 9. Formosa
-- 10. Jujuy
-- 11. La Pampa
-- 12. La Rioja
-- 13. Mendoza
-- 14. Misiones
-- 15. Neuquén
-- 16. Río Negro
-- 17. Salta
-- 18. San Juan
-- 19. San Luis
-- 20. Santa Cruz
-- 21. Santa Fe
-- 22. Santiago del Estero
-- 23. Tierra del Fuego, Antártida e Islas del Atlántico Sur
-- 24. Tucumán
-- =============================================
