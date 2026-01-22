# Solución al Problema de Perfiles No Guardados

## Problema Identificado

Cuando un usuario confirma su cuenta por email, el perfil no se estaba creando automáticamente en la tabla `perfiles`, causando que:
- Los datos de registro (nombre, apellido, etc.) no se guarden
- El usuario no pueda crear direcciones de envío

## Causa Raíz

El trigger `manejar_nuevo_usuario()` se ejecutaba correctamente al crear el usuario, pero había dos problemas:

1. **Falta de manejo de conflictos**: Si se intentaba crear el perfil dos veces (una desde el trigger y otra desde la API), fallaba
2. **Políticas RLS restrictivas**: Las políticas de seguridad no permitían al sistema insertar perfiles automáticamente

## Solución Implementada

### 1. Archivo de Migración Creado
Se creó el archivo: `supabase/migrations/20260121_fix_profile_creation.sql`

### 2. Cambios Principales

#### a) Trigger Mejorado
- Agregado `ON CONFLICT` para manejar inserciones duplicadas
- Mejorado el manejo de errores
- Garantiza que siempre se establezca un rol por defecto ('cliente')

#### b) Políticas RLS Actualizadas
- **Perfiles**: Política "Sistema puede insertar perfiles" permite al trigger y API crear perfiles
- **Direcciones**: Políticas granulares (SELECT, INSERT, UPDATE, DELETE) en lugar de una política general

#### c) Migración de Datos
- Crea perfiles para usuarios existentes que no los tengan

## Cómo Aplicar la Solución

### Opción 1: Usando Supabase Studio (Recomendado)

1. Ir a tu proyecto en Supabase Dashboard
2. Navegar a **SQL Editor**
3. Copiar y pegar el contenido de `supabase/migrations/20260121_fix_profile_creation.sql`
4. Ejecutar el script

### Opción 2: Usando Supabase CLI

```bash
# Si tienes Supabase CLI instalado
supabase db reset
# O aplicar la migración específica
supabase db push
```

### Opción 3: Recrear la base de datos

Si estás en desarrollo y no tienes datos importantes:

1. Ir a **Database > Schema** en Supabase Dashboard
2. Borrar todas las tablas existentes
3. Ejecutar el archivo `supabase/schema.sql` actualizado

## Verificación

Después de aplicar la migración, verifica que:

1. **Nuevos Registros**:
   ```sql
   -- Crear un usuario de prueba y verificar que se cree el perfil automáticamente
   SELECT * FROM auth.users WHERE email = 'test@test.com';
   SELECT * FROM perfiles WHERE email = 'test@test.com';
   ```

2. **Usuarios Existentes**:
   ```sql
   -- Verificar que todos los usuarios tienen perfil
   SELECT 
     au.id, 
     au.email, 
     p.id as perfil_id,
     p.nombre,
     p.apellido
   FROM auth.users au
   LEFT JOIN perfiles p ON au.id = p.id;
   ```

3. **Direcciones**:
   ```sql
   -- Verificar que un usuario puede crear direcciones
   -- (Probar desde la aplicación después del login)
   ```

## Archivos Modificados

1. ✅ `supabase/migrations/20260121_fix_profile_creation.sql` - Nueva migración
2. ✅ `supabase/schema.sql` - Actualizado con trigger y políticas mejoradas

## Próximos Pasos

1. **Aplicar la migración** en tu base de datos de Supabase
2. **Probar el flujo completo**:
   - Registrar un nuevo usuario
   - Confirmar el email
   - Verificar que se pueda acceder a la cuenta
   - Intentar agregar una dirección
3. **Para usuarios existentes**: Si ya tienes usuarios sin perfil, la migración los creará automáticamente

## Notas Adicionales

- El trigger ahora maneja correctamente los casos de inserción duplicada
- Las políticas RLS permiten al sistema crear perfiles pero mantienen la seguridad
- Los usuarios existentes recibirán perfiles con nombre/apellido vacíos si no estaban en los metadatos
