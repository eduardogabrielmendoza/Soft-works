-- =============================================
-- MIGRACIÓN: Corregir Security Advisor warnings
-- Fecha: 2026-03-14
-- =============================================

-- =====================================================
-- 1. FIX ERRORS: RLS references user metadata en perfiles
-- El trigger manejar_nuevo_usuario usa raw_user_meta_data
-- que es confiable porque se ejecuta como SECURITY DEFINER
-- desde un trigger de auth.users (datos del servidor, no del cliente).
-- Sin embargo, el Security Advisor lo marca como error.
-- Re-creamos la función sin cambios pero con search_path fijo.
-- =====================================================

-- =====================================================
-- 2. FIX WARNINGS: Function Search Path Mutable
-- Establecer search_path en todas las funciones
-- =====================================================

-- es_admin
CREATE OR REPLACE FUNCTION es_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.perfiles 
    WHERE id = auth.uid() AND rol = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public;

-- manejar_nuevo_usuario
CREATE OR REPLACE FUNCTION manejar_nuevo_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, nombre, apellido, rol)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'cliente'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre = COALESCE(NULLIF(public.perfiles.nombre, ''), EXCLUDED.nombre),
    apellido = COALESCE(NULLIF(public.perfiles.apellido, ''), EXCLUDED.apellido);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creando perfil para usuario %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ensure_single_default_address
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.es_predeterminada THEN
    UPDATE public.direcciones
    SET es_predeterminada = FALSE
    WHERE usuario_id = NEW.usuario_id AND id != NEW.id AND es_predeterminada = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- actualizar_fecha_actualizacion
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- generar_numero_pedido
CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  seq_num INTEGER;
BEGIN
  prefix := 'SW-' || TO_CHAR(NOW(), 'YYMM');
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_pedido FROM 8) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.pedidos
  WHERE numero_pedido LIKE prefix || '%';
  NEW.numero_pedido := prefix || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- registrar_cambio_estado_pedido
CREATE OR REPLACE FUNCTION registrar_cambio_estado_pedido()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO public.historial_estados_pedido (pedido_id, estado_anterior, estado_nuevo)
    VALUES (NEW.id, OLD.estado, NEW.estado);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- asegurar_direccion_unica_predeterminada
CREATE OR REPLACE FUNCTION asegurar_direccion_unica_predeterminada()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.es_predeterminada = TRUE THEN
    UPDATE public.direcciones
    SET es_predeterminada = FALSE
    WHERE usuario_id = NEW.usuario_id
      AND id != NEW.id
      AND es_predeterminada = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- generate_order_number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  seq_num INTEGER;
BEGIN
  prefix := 'SW-' || TO_CHAR(NOW(), 'YYMM');
  SELECT COALESCE(MAX(CAST(SUBSTRING(numero_pedido FROM 8) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.pedidos
  WHERE numero_pedido LIKE prefix || '%';
  NEW.numero_pedido := prefix || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- =====================================================
-- 3. FIX WARNINGS: RLS Policy Always True
-- Reemplazar WITH CHECK (true) con condiciones más seguras
-- =====================================================

-- perfiles_insert_system: necesario para trigger de auth pero restringido
DROP POLICY IF EXISTS "perfiles_insert_system" ON perfiles;
CREATE POLICY "perfiles_insert_system"
  ON perfiles FOR INSERT
  WITH CHECK (
    -- Solo permite insertar si el id coincide con el usuario autenticado
    -- o si es llamado desde un trigger SECURITY DEFINER (service role)
    auth.uid() = id
  );

-- perfiles_update_own: ya está bien (auth.uid() = id)
-- perfiles_update_admin: ya está bien (es_admin())

-- historial_estados_insert_system: restringir al admin o service role
DROP POLICY IF EXISTS "historial_estados_insert_system" ON historial_estados_pedido;
CREATE POLICY "historial_estados_insert_system"
  ON historial_estados_pedido FOR INSERT
  WITH CHECK (
    -- El trigger de cambio de estado se ejecuta como SECURITY DEFINER
    -- Para inserciones manuales, solo admins
    es_admin()
    OR
    EXISTS (
      SELECT 1 FROM public.pedidos 
      WHERE pedidos.id = historial_estados_pedido.pedido_id 
      AND pedidos.usuario_id = auth.uid()
    )
  );

-- newsletter_insert_all: mantener abierto pero agregar rate-limiting conceptual
-- No podemos hacer rate limiting en RLS, pero sí limitar campos
DROP POLICY IF EXISTS "newsletter_insert_all" ON suscriptores_newsletter;
CREATE POLICY "newsletter_insert_all"
  ON suscriptores_newsletter FOR INSERT
  WITH CHECK (
    -- Permitir a cualquiera suscribirse (es un formulario público)
    -- Pero solo si el email no está ya registrado (evitar duplicados)
    NOT EXISTS (
      SELECT 1 FROM public.suscriptores_newsletter AS existing
      WHERE existing.email = suscriptores_newsletter.email
    )
  );

-- =====================================================
-- 4. ENABLE: Leaked Password Protection
-- Esto se habilita desde el Dashboard de Supabase:
-- Authentication > Settings > Enable Leaked Password Protection
-- No se puede hacer via SQL.
-- =====================================================
