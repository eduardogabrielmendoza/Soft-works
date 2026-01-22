-- =============================================
-- POLÍTICAS RLS COMPLETAS Y DEFINITIVAS
-- Sin recursión infinita - Todas las tablas
-- =============================================

-- =====================================================
-- PASO 1: ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
-- =====================================================

-- Perfiles
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON perfiles;
DROP POLICY IF EXISTS "Usuarios pueden ver su perfil" ON perfiles;
DROP POLICY IF EXISTS "Admins pueden ver todos los perfiles" ON perfiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON perfiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su perfil" ON perfiles;
DROP POLICY IF EXISTS "Admins pueden actualizar todos los perfiles" ON perfiles;
DROP POLICY IF EXISTS "Sistema puede insertar perfiles" ON perfiles;
DROP POLICY IF EXISTS "Usuarios pueden insertar su perfil" ON perfiles;

-- Direcciones
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias direcciones" ON direcciones;
DROP POLICY IF EXISTS "Usuarios pueden ver sus direcciones" ON direcciones;
DROP POLICY IF EXISTS "Usuarios pueden crear sus propias direcciones" ON direcciones;
DROP POLICY IF EXISTS "Usuarios pueden crear sus direcciones" ON direcciones;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias direcciones" ON direcciones;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus direcciones" ON direcciones;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias direcciones" ON direcciones;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus direcciones" ON direcciones;
DROP POLICY IF EXISTS "Admins pueden gestionar todas las direcciones" ON direcciones;
DROP POLICY IF EXISTS "Usuarios pueden gestionar sus direcciones" ON direcciones;

-- Productos
DROP POLICY IF EXISTS "Cualquiera puede ver productos activos" ON productos;
DROP POLICY IF EXISTS "Admins pueden gestionar todos los productos" ON productos;

-- Pedidos
DROP POLICY IF EXISTS "Usuarios pueden ver sus pedidos" ON pedidos;
DROP POLICY IF EXISTS "Usuarios pueden crear sus pedidos" ON pedidos;
DROP POLICY IF EXISTS "Usuarios pueden actualizar pedidos pendientes" ON pedidos;
DROP POLICY IF EXISTS "Admins pueden gestionar todos los pedidos" ON pedidos;

-- Items Pedido
DROP POLICY IF EXISTS "Usuarios pueden ver items de sus pedidos" ON items_pedido;
DROP POLICY IF EXISTS "Usuarios pueden crear items en sus pedidos" ON items_pedido;
DROP POLICY IF EXISTS "Admins pueden gestionar todos los items" ON items_pedido;

-- Verificaciones Pago
DROP POLICY IF EXISTS "Usuarios pueden ver sus verificaciones" ON verificaciones_pago;
DROP POLICY IF EXISTS "Usuarios pueden crear verificaciones de sus pedidos" ON verificaciones_pago;
DROP POLICY IF EXISTS "Admins pueden gestionar todas las verificaciones" ON verificaciones_pago;

-- Info Envío
DROP POLICY IF EXISTS "Usuarios pueden ver info de envío de sus pedidos" ON info_envio;
DROP POLICY IF EXISTS "Admins pueden gestionar toda la info de envío" ON info_envio;

-- Carrito
DROP POLICY IF EXISTS "Usuarios pueden gestionar su carrito" ON carrito_items;

-- Lista Deseos
DROP POLICY IF EXISTS "Usuarios pueden gestionar su lista de deseos" ON lista_deseos;

-- Cuentas Bancarias
DROP POLICY IF EXISTS "Cualquiera puede ver cuentas bancarias activas" ON cuentas_bancarias;
DROP POLICY IF EXISTS "Admins pueden gestionar cuentas bancarias" ON cuentas_bancarias;

-- Zonas Envío
DROP POLICY IF EXISTS "Cualquiera puede ver zonas de envío activas" ON zonas_envio;
DROP POLICY IF EXISTS "Admins pueden gestionar zonas de envío" ON zonas_envio;

-- Configuración Tienda
DROP POLICY IF EXISTS "Cualquiera puede ver configuración" ON configuracion_tienda;
DROP POLICY IF EXISTS "Admins pueden gestionar configuración" ON configuracion_tienda;

-- Historial Estados
DROP POLICY IF EXISTS "Usuarios pueden ver historial de sus pedidos" ON historial_estados_pedido;
DROP POLICY IF EXISTS "Admins pueden ver todo el historial" ON historial_estados_pedido;

-- Newsletter
DROP POLICY IF EXISTS "Cualquiera puede suscribirse al newsletter" ON suscriptores_newsletter;
DROP POLICY IF EXISTS "Admins pueden gestionar newsletter" ON suscriptores_newsletter;

-- =====================================================
-- PASO 2: CREAR FUNCIÓN HELPER PARA VERIFICAR ADMIN
-- Esta función evita la recursión infinita
-- =====================================================

CREATE OR REPLACE FUNCTION es_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Verificar en la tabla perfiles si el usuario actual es admin
  RETURN EXISTS (
    SELECT 1 FROM perfiles 
    WHERE id = auth.uid() AND rol = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- PASO 3: HABILITAR RLS EN TODAS LAS TABLAS
-- =====================================================

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

-- =====================================================
-- PASO 4: POLÍTICAS PARA PERFILES
-- =====================================================

-- Usuarios pueden ver solo su propio perfil
CREATE POLICY "perfiles_select_own"
  ON perfiles FOR SELECT
  USING (auth.uid() = id);

-- Admins pueden ver todos los perfiles
CREATE POLICY "perfiles_select_admin"
  ON perfiles FOR SELECT
  USING (es_admin());

-- Permitir inserción (para trigger y API de registro)
CREATE POLICY "perfiles_insert_system"
  ON perfiles FOR INSERT
  WITH CHECK (true);

-- Usuarios pueden actualizar solo su propio perfil
CREATE POLICY "perfiles_update_own"
  ON perfiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins pueden actualizar cualquier perfil
CREATE POLICY "perfiles_update_admin"
  ON perfiles FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

-- =====================================================
-- PASO 5: POLÍTICAS PARA DIRECCIONES
-- =====================================================

-- Ver solo direcciones propias
CREATE POLICY "direcciones_select_own"
  ON direcciones FOR SELECT
  USING (auth.uid() = usuario_id);

-- Admins pueden ver todas las direcciones
CREATE POLICY "direcciones_select_admin"
  ON direcciones FOR SELECT
  USING (es_admin());

-- Crear direcciones propias
CREATE POLICY "direcciones_insert_own"
  ON direcciones FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Actualizar direcciones propias
CREATE POLICY "direcciones_update_own"
  ON direcciones FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- Admins pueden actualizar cualquier dirección
CREATE POLICY "direcciones_update_admin"
  ON direcciones FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

-- Eliminar direcciones propias
CREATE POLICY "direcciones_delete_own"
  ON direcciones FOR DELETE
  USING (auth.uid() = usuario_id);

-- Admins pueden eliminar cualquier dirección
CREATE POLICY "direcciones_delete_admin"
  ON direcciones FOR DELETE
  USING (es_admin());

-- =====================================================
-- PASO 6: POLÍTICAS PARA PRODUCTOS
-- =====================================================

-- Cualquier persona (autenticada o no) puede ver productos activos
CREATE POLICY "productos_select_active"
  ON productos FOR SELECT
  USING (activo = true);

-- Solo admins pueden crear productos
CREATE POLICY "productos_insert_admin"
  ON productos FOR INSERT
  WITH CHECK (es_admin());

-- Solo admins pueden actualizar productos
CREATE POLICY "productos_update_admin"
  ON productos FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

-- Solo admins pueden eliminar productos
CREATE POLICY "productos_delete_admin"
  ON productos FOR DELETE
  USING (es_admin());

-- =====================================================
-- PASO 7: POLÍTICAS PARA PEDIDOS
-- =====================================================

-- Ver solo pedidos propios
CREATE POLICY "pedidos_select_own"
  ON pedidos FOR SELECT
  USING (auth.uid() = usuario_id OR es_admin());

-- Crear pedidos propios
CREATE POLICY "pedidos_insert_own"
  ON pedidos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- Actualizar pedidos propios (solo en ciertos estados)
CREATE POLICY "pedidos_update_own"
  ON pedidos FOR UPDATE
  USING (
    (auth.uid() = usuario_id AND estado IN ('pendiente_pago', 'esperando_verificacion'))
    OR es_admin()
  )
  WITH CHECK (
    (auth.uid() = usuario_id AND estado IN ('pendiente_pago', 'esperando_verificacion'))
    OR es_admin()
  );

-- =====================================================
-- PASO 8: POLÍTICAS PARA ITEMS_PEDIDO
-- =====================================================

-- Ver items de pedidos propios
CREATE POLICY "items_pedido_select_own"
  ON items_pedido FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pedidos 
      WHERE pedidos.id = items_pedido.pedido_id 
      AND pedidos.usuario_id = auth.uid()
    )
    OR es_admin()
  );

-- Crear items en pedidos propios
CREATE POLICY "items_pedido_insert_own"
  ON items_pedido FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pedidos 
      WHERE pedidos.id = items_pedido.pedido_id 
      AND pedidos.usuario_id = auth.uid()
    )
  );

-- Admins pueden actualizar/eliminar items
CREATE POLICY "items_pedido_update_admin"
  ON items_pedido FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

CREATE POLICY "items_pedido_delete_admin"
  ON items_pedido FOR DELETE
  USING (es_admin());

-- =====================================================
-- PASO 9: POLÍTICAS PARA VERIFICACIONES_PAGO
-- =====================================================

-- Ver verificaciones de pedidos propios
CREATE POLICY "verificaciones_select_own"
  ON verificaciones_pago FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pedidos 
      WHERE pedidos.id = verificaciones_pago.pedido_id 
      AND pedidos.usuario_id = auth.uid()
    )
    OR es_admin()
  );

-- Crear verificaciones en pedidos propios
CREATE POLICY "verificaciones_insert_own"
  ON verificaciones_pago FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pedidos 
      WHERE pedidos.id = verificaciones_pago.pedido_id 
      AND pedidos.usuario_id = auth.uid()
    )
  );

-- Solo admins pueden actualizar verificaciones
CREATE POLICY "verificaciones_update_admin"
  ON verificaciones_pago FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

-- =====================================================
-- PASO 10: POLÍTICAS PARA INFO_ENVIO
-- =====================================================

-- Ver info de envío de pedidos propios
CREATE POLICY "info_envio_select_own"
  ON info_envio FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pedidos 
      WHERE pedidos.id = info_envio.pedido_id 
      AND pedidos.usuario_id = auth.uid()
    )
    OR es_admin()
  );

-- Solo admins pueden gestionar info de envío
CREATE POLICY "info_envio_insert_admin"
  ON info_envio FOR INSERT
  WITH CHECK (es_admin());

CREATE POLICY "info_envio_update_admin"
  ON info_envio FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

CREATE POLICY "info_envio_delete_admin"
  ON info_envio FOR DELETE
  USING (es_admin());

-- =====================================================
-- PASO 11: POLÍTICAS PARA CARRITO_ITEMS
-- =====================================================

-- Gestionar carrito propio (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "carrito_select_own"
  ON carrito_items FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "carrito_insert_own"
  ON carrito_items FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "carrito_update_own"
  ON carrito_items FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "carrito_delete_own"
  ON carrito_items FOR DELETE
  USING (auth.uid() = usuario_id);

-- =====================================================
-- PASO 12: POLÍTICAS PARA LISTA_DESEOS
-- =====================================================

-- Gestionar lista de deseos propia
CREATE POLICY "lista_deseos_select_own"
  ON lista_deseos FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "lista_deseos_insert_own"
  ON lista_deseos FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "lista_deseos_delete_own"
  ON lista_deseos FOR DELETE
  USING (auth.uid() = usuario_id);

-- =====================================================
-- PASO 13: POLÍTICAS PARA CUENTAS_BANCARIAS
-- =====================================================

-- Todos pueden ver cuentas bancarias activas
CREATE POLICY "cuentas_bancarias_select_active"
  ON cuentas_bancarias FOR SELECT
  USING (activa = true OR es_admin());

-- Solo admins pueden gestionar cuentas bancarias
CREATE POLICY "cuentas_bancarias_insert_admin"
  ON cuentas_bancarias FOR INSERT
  WITH CHECK (es_admin());

CREATE POLICY "cuentas_bancarias_update_admin"
  ON cuentas_bancarias FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

CREATE POLICY "cuentas_bancarias_delete_admin"
  ON cuentas_bancarias FOR DELETE
  USING (es_admin());

-- =====================================================
-- PASO 14: POLÍTICAS PARA ZONAS_ENVIO
-- =====================================================

-- Todos pueden ver zonas de envío activas
CREATE POLICY "zonas_envio_select_active"
  ON zonas_envio FOR SELECT
  USING (activa = true OR es_admin());

-- Solo admins pueden gestionar zonas de envío
CREATE POLICY "zonas_envio_insert_admin"
  ON zonas_envio FOR INSERT
  WITH CHECK (es_admin());

CREATE POLICY "zonas_envio_update_admin"
  ON zonas_envio FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

CREATE POLICY "zonas_envio_delete_admin"
  ON zonas_envio FOR DELETE
  USING (es_admin());

-- =====================================================
-- PASO 15: POLÍTICAS PARA CONFIGURACION_TIENDA
-- =====================================================

-- Todos pueden ver configuración
CREATE POLICY "configuracion_select_all"
  ON configuracion_tienda FOR SELECT
  USING (true);

-- Solo admins pueden gestionar configuración
CREATE POLICY "configuracion_insert_admin"
  ON configuracion_tienda FOR INSERT
  WITH CHECK (es_admin());

CREATE POLICY "configuracion_update_admin"
  ON configuracion_tienda FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

CREATE POLICY "configuracion_delete_admin"
  ON configuracion_tienda FOR DELETE
  USING (es_admin());

-- =====================================================
-- PASO 16: POLÍTICAS PARA HISTORIAL_ESTADOS_PEDIDO
-- =====================================================

-- Ver historial de pedidos propios
CREATE POLICY "historial_estados_select_own"
  ON historial_estados_pedido FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pedidos 
      WHERE pedidos.id = historial_estados_pedido.pedido_id 
      AND pedidos.usuario_id = auth.uid()
    )
    OR es_admin()
  );

-- Sistema puede insertar (trigger automático)
CREATE POLICY "historial_estados_insert_system"
  ON historial_estados_pedido FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- PASO 17: POLÍTICAS PARA SUSCRIPTORES_NEWSLETTER
-- =====================================================

-- Cualquiera puede suscribirse
CREATE POLICY "newsletter_insert_all"
  ON suscriptores_newsletter FOR INSERT
  WITH CHECK (true);

-- Solo admins pueden ver/gestionar suscriptores
CREATE POLICY "newsletter_select_admin"
  ON suscriptores_newsletter FOR SELECT
  USING (es_admin());

CREATE POLICY "newsletter_update_admin"
  ON suscriptores_newsletter FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

CREATE POLICY "newsletter_delete_admin"
  ON suscriptores_newsletter FOR DELETE
  USING (es_admin());

-- =====================================================
-- FIN - Políticas RLS configuradas correctamente
-- =====================================================

-- Verificación: Contar políticas creadas
SELECT 
  schemaname,
  tablename,
  COUNT(*) as num_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
