-- =============================================
-- MIGRACIÓN: Corregir Security Advisor warnings
-- Fecha: 2026-03-14
-- =============================================

-- =====================================================
-- 1. FIX ERRORS: RLS references user metadata en perfiles
-- Las policies originales del schema usaban auth.jwt() -> 'user_metadata'
-- que es inseguro porque el cliente puede manipular user_metadata.
-- Eliminamos esas policies si aún existen y nos aseguramos de usar es_admin().
-- =====================================================

-- Eliminar policies viejas que usan user_metadata/app_metadata (del schema original)
DROP POLICY IF EXISTS "Admins pueden ver todos los perfiles" ON perfiles;
DROP POLICY IF EXISTS "Admins pueden actualizar todos los perfiles" ON perfiles;
DROP POLICY IF EXISTS "Sistema puede insertar perfiles" ON perfiles;
DROP POLICY IF EXISTS "Usuarios pueden ver su perfil" ON perfiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su perfil" ON perfiles;

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

-- log_order_status_change (existe en la DB pero faltaba en la migración anterior)
CREATE OR REPLACE FUNCTION log_order_status_change()
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

-- =====================================================
-- 3. FIX WARNINGS: RLS Policy Always True
-- Reemplazar WITH CHECK (true) con condiciones más seguras
-- =====================================================

-- perfiles_insert_system: necesario para trigger de auth pero restringido
DROP POLICY IF EXISTS "perfiles_insert_system" ON perfiles;
CREATE POLICY "perfiles_insert_system"
  ON perfiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
  );

-- historial_estados_insert_system: restringir al admin o dueño del pedido
DROP POLICY IF EXISTS "historial_estados_insert_system" ON historial_estados_pedido;
CREATE POLICY "historial_estados_insert_system"
  ON historial_estados_pedido FOR INSERT
  WITH CHECK (
    es_admin()
    OR
    EXISTS (
      SELECT 1 FROM public.pedidos 
      WHERE pedidos.id = historial_estados_pedido.pedido_id 
      AND pedidos.usuario_id = auth.uid()
    )
  );

-- newsletter_insert_all: público pero sin duplicados
DROP POLICY IF EXISTS "newsletter_insert_all" ON suscriptores_newsletter;
CREATE POLICY "newsletter_insert_all"
  ON suscriptores_newsletter FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.suscriptores_newsletter AS existing
      WHERE existing.email = suscriptores_newsletter.email
    )
  );

-- =====================================================
-- 4. ENABLE: Leaked Password Protection
-- Esto se habilita desde el Dashboard de Supabase:
-- Authentication > Providers > Email > Enable Leaked Password Protection
-- No se puede hacer via SQL.
-- =====================================================
