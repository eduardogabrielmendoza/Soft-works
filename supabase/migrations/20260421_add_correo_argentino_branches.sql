-- =============================================
-- MIGRACION: Sucursales de Correo Argentino
-- Fecha: 2026-04-21
-- =============================================

CREATE TABLE IF NOT EXISTS sucursales_correo_argentino (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_key TEXT UNIQUE NOT NULL,
  provincia_codigo TEXT NOT NULL,
  provincia_nombre TEXT NOT NULL,
  normalized_province_name TEXT NOT NULL,
  localidad_id TEXT NOT NULL,
  localidad_nombre TEXT NOT NULL,
  localidad_nombre_solicitada TEXT NOT NULL,
  codigo_postal TEXT,
  tipo_sucursal TEXT NOT NULL,
  nombre TEXT NOT NULL,
  direccion TEXT NOT NULL,
  horarios TEXT,
  latitud DOUBLE PRECISION,
  longitud DOUBLE PRECISION,
  service_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
  service_names JSONB DEFAULT '[]'::jsonb NOT NULL,
  normalized_branch_name TEXT NOT NULL,
  normalized_address TEXT NOT NULL,
  normalized_locality_name TEXT NOT NULL,
  normalized_search_text TEXT NOT NULL,
  admite_recepcion_ecommerce BOOLEAN DEFAULT FALSE NOT NULL,
  admite_entrega_ecommerce BOOLEAN DEFAULT FALSE NOT NULL,
  admite_etienda BOOLEAN DEFAULT FALSE NOT NULL,
  es_elegible_envio_sucursal BOOLEAN DEFAULT FALSE NOT NULL,
  activa BOOLEAN DEFAULT TRUE NOT NULL,
  ultimo_scrapeo TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fecha_creacion TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sucursales_correo_provincia_codigo
  ON sucursales_correo_argentino(provincia_codigo);

CREATE INDEX IF NOT EXISTS idx_sucursales_correo_provincia_nombre
  ON sucursales_correo_argentino(provincia_nombre);

CREATE INDEX IF NOT EXISTS idx_sucursales_correo_normalized_provincia
  ON sucursales_correo_argentino(normalized_province_name);

CREATE INDEX IF NOT EXISTS idx_sucursales_correo_localidad_nombre
  ON sucursales_correo_argentino(localidad_nombre);

CREATE INDEX IF NOT EXISTS idx_sucursales_correo_codigo_postal
  ON sucursales_correo_argentino(codigo_postal);

CREATE INDEX IF NOT EXISTS idx_sucursales_correo_elegibles
  ON sucursales_correo_argentino(es_elegible_envio_sucursal, activa);

CREATE INDEX IF NOT EXISTS idx_sucursales_correo_normalized_search
  ON sucursales_correo_argentino(normalized_search_text);

ALTER TABLE sucursales_correo_argentino ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sucursales_correo_select_active"
  ON sucursales_correo_argentino FOR SELECT
  USING (activa = true OR es_admin());

CREATE POLICY "sucursales_correo_insert_admin"
  ON sucursales_correo_argentino FOR INSERT
  WITH CHECK (es_admin());

CREATE POLICY "sucursales_correo_update_admin"
  ON sucursales_correo_argentino FOR UPDATE
  USING (es_admin())
  WITH CHECK (es_admin());

CREATE POLICY "sucursales_correo_delete_admin"
  ON sucursales_correo_argentino FOR DELETE
  USING (es_admin());
