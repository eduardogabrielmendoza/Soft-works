# 📋 GUÍA: Aplicar Migraciones de Base de Datos en Supabase

## ✅ Errores Corregidos

Todos los errores de TypeScript y sintaxis han sido corregidos:
- ✅ Error en Navbar.tsx línea 167 (elemento `motion.` incorrecto)
- ✅ Error en admin/pedidos/[id]/page.tsx línea 231 (comentario mal formateado)
- ✅ Error en RelatedProducts.tsx (tipos implícitos)
- ✅ Error en MonthlyRevenueChart.tsx (tipos del formatter)

## 🚀 Cómo Aplicar las Migraciones

### Opción 1: Panel Web de Supabase (RECOMENDADO)

1. **Accede a tu proyecto:**
   - Ve a: https://app.supabase.com
   - Inicia sesión
   - Selecciona tu proyecto: `ixcyuyooxwxcoawsghgr`

2. **Abre el SQL Editor:**
   - En el menú lateral izquierdo, haz clic en **"SQL Editor"**
   - Haz clic en **"New query"**

3. **Aplica la primera migración:**
   - Copia TODO el contenido del archivo: `supabase/migrations/20260121_fix_profile_creation.sql`
   - Pégalo en el editor SQL
   - Haz clic en **"Run"** (o presiona Ctrl+Enter)
   - ✅ Verifica que diga "Success" sin errores

4. **Aplica la segunda migración:**
   - Haz clic en **"New query"** de nuevo
   - Copia TODO el contenido del archivo: `supabase/migrations/20260121_rls_policies_final.sql`
   - Pégalo en el editor SQL
   - Haz clic en **"Run"** (o presiona Ctrl+Enter)
   - ✅ Verifica que diga "Success" sin errores

5. **Verifica la aplicación:**
   - En el menú lateral, ve a **"Database"** → **"Functions"**
   - Deberías ver la función `es_admin()` y `manejar_nuevo_usuario()`
   - En **"Database"** → **"Policies"**, deberías ver todas las políticas RLS creadas

### Opción 2: Supabase CLI (Avanzado)

Si prefieres usar CLI, necesitas instalarlo primero:

```powershell
# 1. Instalar Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# O con npm:
npm install -g supabase

# 2. Verificar instalación
supabase --version

# 3. Iniciar sesión
supabase login

# 4. Vincular tu proyecto
supabase link --project-ref ixcyuyooxwxcoawsghgr

# 5. Aplicar migraciones
supabase db push
```

## 🔍 Qué hacen las migraciones

### Migración 1: `20260121_fix_profile_creation.sql`
- ✅ Corrige el trigger de creación automática de perfiles
- ✅ Permite que los perfiles se creen incluso si el email no está confirmado
- ✅ Arregla políticas RLS para evitar recursión infinita
- ✅ Crea perfiles para usuarios existentes que no los tengan

### Migración 2: `20260121_rls_policies_final.sql`
- ✅ Crea políticas RLS completas para TODAS las 14 tablas
- ✅ Agrega función `es_admin()` para evitar recursión
- ✅ Permite que admins vean todos los clientes/pedidos/datos
- ✅ Permite que usuarios vean solo sus propios datos

## ⚠️ Importante

- **NO edites** las migraciones una vez aplicadas
- **Aplícalas en orden**: primero la 1, después la 2
- Si hay errores, copia el mensaje exacto para revisarlo
- Las políticas RLS están diseñadas para proteger datos sensibles

## 🆘 Problemas Comunes

**Error: "policy already exists"**
- Solución: Las políticas ya están aplicadas, todo bien

**Error: "function es_admin does not exist"**
- Solución: Aplica primero la migración 2 que crea esta función

**Error: "permission denied"**
- Solución: Usa el SQL Editor con tu cuenta (ya tiene permisos de admin)

## ✅ Verificación Final

Después de aplicar las migraciones, prueba:
1. Registrar un nuevo usuario
2. Verificar que se cree el perfil automáticamente
3. Login como admin y verificar que puedas ver todos los clientes
4. Login como usuario normal y verificar que solo veas tus datos
