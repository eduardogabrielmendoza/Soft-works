-- =============================================
-- MIGRACIÓN: Corregir creación automática de perfiles
-- Fecha: 2026-01-21
-- =============================================

-- 1. Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS trigger_nuevo_usuario ON auth.users;
DROP FUNCTION IF EXISTS manejar_nuevo_usuario();

-- 2. Crear función mejorada para manejar nuevo usuario
-- Esta función se ejecuta cuando se inserta un usuario en auth.users
-- Incluso si el email no está confirmado, se crea el perfil
CREATE OR REPLACE FUNCTION manejar_nuevo_usuario()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar perfil con los datos del metadata
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
    -- Log el error pero no fallar la creación del usuario
    RAISE WARNING 'Error creando perfil para usuario %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear trigger que se ejecuta al insertar usuario
CREATE TRIGGER trigger_nuevo_usuario
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION manejar_nuevo_usuario();

-- 4. Asegurar que las políticas RLS permitan acceso correcto

-- Eliminar políticas existentes de perfiles
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON perfiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON perfiles;
DROP POLICY IF EXISTS "Perfiles son visibles para todos" ON perfiles;
DROP POLICY IF EXISTS "Solo admins pueden insertar perfiles" ON perfiles;

-- Habilitar RLS
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

-- Crear políticas mejoradas SIN recursión
-- Permitir a usuarios ver su propio perfil
CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON perfiles FOR SELECT
  USING (auth.uid() = id);

-- Permitir a admins ver todos los perfiles (usando rol del JWT)
CREATE POLICY "Admins pueden ver todos los perfiles"
  ON perfiles FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    OR 
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  );

-- Permitir a usuarios actualizar su propio perfil
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON perfiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Permitir a admins actualizar cualquier perfil
CREATE POLICY "Admins pueden actualizar todos los perfiles"
  ON perfiles FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    OR 
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  );

-- Permitir inserción de perfiles (para el trigger y la API)
CREATE POLICY "Sistema puede insertar perfiles"
  ON perfiles FOR INSERT
  WITH CHECK (true);

-- 5. Políticas RLS para direcciones
-- Eliminar políticas existentes de direcciones
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias direcciones" ON direcciones;
DROP POLICY IF EXISTS "Usuarios pueden crear sus propias direcciones" ON direcciones;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propias direcciones" ON direcciones;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propias direcciones" ON direcciones;
DROP POLICY IF EXISTS "Admins pueden ver todas las direcciones" ON direcciones;

-- Habilitar RLS
ALTER TABLE direcciones ENABLE ROW LEVEL SECURITY;

-- Permitir a usuarios gestionar sus propias direcciones
CREATE POLICY "Usuarios pueden ver sus propias direcciones"
  ON direcciones FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden crear sus propias direcciones"
  ON direcciones FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden actualizar sus propias direcciones"
  ON direcciones FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios pueden eliminar sus propias direcciones"
  ON direcciones FOR DELETE
  USING (auth.uid() = usuario_id);

-- 6. Crear perfiles para usuarios existentes que no los tengan
-- Esto corrige cualquier usuario que ya se haya registrado y no tenga perfil
INSERT INTO public.perfiles (id, email, nombre, apellido, rol)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', ''),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  'cliente'
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.perfiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;
