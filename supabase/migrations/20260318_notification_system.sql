-- =============================================
-- MIGRACIÓN: Sistema de Notificaciones y Recuperación de Contraseña
-- Fecha: 2026-03-18
-- =============================================

-- =====================================================
-- 1. ENUM: Estado de solicitud de recuperación
-- =====================================================
CREATE TYPE estado_solicitud_recuperacion AS ENUM ('pendiente', 'aprobada', 'rechazada', 'completada');

-- =====================================================
-- 2. TABLA: notificaciones
-- =====================================================
CREATE TABLE notificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- 'bienvenida', 'pedido_pago_aprobado', 'pedido_pago_rechazado', 'pedido_enviado', 'pedido_entregado', 'recuperacion_aprobada', 'recuperacion_rechazada', 'admin_solicitud_recuperacion'
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- datos extra (pedido_id, tracking, etc)
  leida BOOLEAN DEFAULT FALSE,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notificaciones_usuario ON notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON notificaciones(usuario_id, leida);
CREATE INDEX idx_notificaciones_fecha ON notificaciones(fecha_creacion DESC);

-- =====================================================
-- 3. TABLA: solicitudes_recuperacion
-- =====================================================
CREATE TABLE solicitudes_recuperacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nombre_ingresado TEXT NOT NULL,
  estado estado_solicitud_recuperacion DEFAULT 'pendiente' NOT NULL,
  token_temporal TEXT,
  pregunta_seguridad_verificada BOOLEAN DEFAULT FALSE,
  admin_nota TEXT, -- nota del admin al aprobar/rechazar
  fecha_creacion TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fecha_resolucion TIMESTAMPTZ
);

CREATE INDEX idx_solicitudes_usuario ON solicitudes_recuperacion(usuario_id);
CREATE INDEX idx_solicitudes_estado ON solicitudes_recuperacion(estado);
CREATE INDEX idx_solicitudes_token ON solicitudes_recuperacion(token_temporal);

-- =====================================================
-- 4. MODIFICAR TABLA: perfiles
-- =====================================================
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS pregunta_seguridad TEXT;
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS respuesta_seguridad TEXT;

-- =====================================================
-- 5. RLS: notificaciones
-- =====================================================
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver sus propias notificaciones
CREATE POLICY "notificaciones_select_own"
  ON notificaciones FOR SELECT
  USING (auth.uid() = usuario_id);

-- Admins pueden ver todas las notificaciones
CREATE POLICY "notificaciones_select_admin"
  ON notificaciones FOR SELECT
  USING (es_admin());

-- Sistema puede insertar notificaciones (via service role o admin)
CREATE POLICY "notificaciones_insert_system"
  ON notificaciones FOR INSERT
  WITH CHECK (
    auth.uid() = usuario_id OR es_admin()
  );

-- Usuarios pueden marcar como leídas sus propias notificaciones
CREATE POLICY "notificaciones_update_own"
  ON notificaciones FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- Admins pueden actualizar cualquier notificación
CREATE POLICY "notificaciones_update_admin"
  ON notificaciones FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

-- Usuarios pueden eliminar sus propias notificaciones
CREATE POLICY "notificaciones_delete_own"
  ON notificaciones FOR DELETE
  USING (auth.uid() = usuario_id);

-- =====================================================
-- 6. RLS: solicitudes_recuperacion
-- =====================================================
ALTER TABLE solicitudes_recuperacion ENABLE ROW LEVEL SECURITY;

-- Admins pueden ver todas las solicitudes
CREATE POLICY "solicitudes_select_admin"
  ON solicitudes_recuperacion FOR SELECT
  USING (es_admin());

-- Usuarios pueden ver sus propias solicitudes
CREATE POLICY "solicitudes_select_own"
  ON solicitudes_recuperacion FOR SELECT
  USING (auth.uid() = usuario_id);

-- Inserción via service role (la API usa service role key)
-- No hay policy de INSERT para usuarios normales; se hace via API con service role

-- Admins pueden actualizar solicitudes (aprobar/rechazar)
CREATE POLICY "solicitudes_update_admin"
  ON solicitudes_recuperacion FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

-- =====================================================
-- 7. Habilitar Realtime para notificaciones
-- (También se debe habilitar desde el Dashboard)
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE notificaciones;
