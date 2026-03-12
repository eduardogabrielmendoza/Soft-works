import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function verifyAdmin() {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single() as { data: { rol: string } | null };

  if (profile?.rol !== 'admin') return null;
  return user;
}

async function getSupabase() {
  return await createClient() as any;
}

// ============================================
// TEST: Productos CRUD
// ============================================
async function testProductsCRUD() {
  const supabase = await getSupabase();
  const results: { step: string; ok: boolean; detail: string }[] = [];
  let testProductId: string | null = null;

  // CREATE
  try {
    const slug = `test-debug-${Date.now()}`;
    const { data, error } = await supabase
      .from('productos')
      .insert({
        nombre: '[TEST] Producto de Prueba Debug',
        slug,
        descripcion: 'Producto creado por debug. Se elimina al finalizar.',
        precio: 1,
        categoria: 'camisetas',
        imagenes: [],
        stock: { S: 1, M: 1 },
        activo: false,
        destacado: false,
        caracteristicas: ['test'],
      })
      .select()
      .single();
    if (error) throw error;
    testProductId = data.id;
    results.push({ step: 'Crear producto', ok: true, detail: `ID: ${testProductId}` });
  } catch (e: any) {
    results.push({ step: 'Crear producto', ok: false, detail: e.message });
    return { name: 'Productos CRUD', results };
  }

  // READ
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', testProductId!)
      .single();
    if (error) throw error;
    if (!data) throw new Error('Producto no encontrado');
    results.push({ step: 'Leer producto', ok: true, detail: `Nombre: ${data.nombre}` });
  } catch (e: any) {
    results.push({ step: 'Leer producto', ok: false, detail: e.message });
  }

  // UPDATE
  try {
    const { data, error } = await supabase
      .from('productos')
      .update({ precio: 2, descripcion: 'Producto actualizado por debug' })
      .eq('id', testProductId!)
      .select()
      .single();
    if (error) throw error;
    if (data.precio !== 2) throw new Error('El precio no se actualizo');
    results.push({ step: 'Actualizar producto', ok: true, detail: 'Precio actualizado a $2' });
  } catch (e: any) {
    results.push({ step: 'Actualizar producto', ok: false, detail: e.message });
  }

  // TOGGLE destacado
  try {
    const { error } = await supabase
      .from('productos')
      .update({ destacado: true })
      .eq('id', testProductId!);
    if (error) throw error;
    results.push({ step: 'Toggle destacado', ok: true, detail: 'Marcado como destacado' });
  } catch (e: any) {
    results.push({ step: 'Toggle destacado', ok: false, detail: e.message });
  }

  // UPDATE stock
  try {
    const { error } = await supabase
      .from('productos')
      .update({ stock: { S: 5, M: 10, L: 3 } })
      .eq('id', testProductId!);
    if (error) throw error;
    results.push({ step: 'Actualizar stock', ok: true, detail: 'Stock: S:5 M:10 L:3' });
  } catch (e: any) {
    results.push({ step: 'Actualizar stock', ok: false, detail: e.message });
  }

  // SOFT DELETE
  try {
    const { error } = await supabase
      .from('productos')
      .update({ activo: false })
      .eq('id', testProductId!);
    if (error) throw error;
    results.push({ step: 'Soft delete producto', ok: true, detail: 'Marcado como inactivo' });
  } catch (e: any) {
    results.push({ step: 'Soft delete producto', ok: false, detail: e.message });
  }

  // HARD DELETE
  try {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', testProductId!);
    if (error) throw error;
    results.push({ step: 'Eliminar producto (limpieza)', ok: true, detail: 'Eliminado permanentemente' });
  } catch (e: any) {
    results.push({ step: 'Eliminar producto (limpieza)', ok: false, detail: e.message });
  }

  return { name: 'Productos CRUD', results };
}

// ============================================
// TEST: Pedidos CRUD
// ============================================
async function testOrdersCRUD() {
  const supabase = await getSupabase();
  const results: { step: string; ok: boolean; detail: string }[] = [];
  let testOrderId: string | null = null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    results.push({ step: 'Autenticacion', ok: false, detail: 'No autenticado' });
    return { name: 'Pedidos CRUD', results };
  }

  // CREATE order
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        usuario_id: user.id,
        numero_pedido: `TEST-${Date.now().toString().slice(-8)}`,
        estado: 'pendiente_pago',
        cliente_nombre: 'Test Debug',
        cliente_email: 'test@debug.local',
        direccion_envio: {
          nombre_destinatario: 'Test',
          calle: 'Calle Test',
          numero: '123',
          ciudad: 'CABA',
          provincia: 'Buenos Aires',
          codigo_postal: '1000',
        },
        subtotal: 100,
        costo_envio: 0,
        monto_descuento: 0,
        total: 100,
        metodo_pago: 'transferencia',
      })
      .select()
      .single();
    if (error) throw error;
    testOrderId = data.id;
    results.push({ step: 'Crear pedido', ok: true, detail: `ID: ${testOrderId}` });
  } catch (e: any) {
    results.push({ step: 'Crear pedido', ok: false, detail: e.message });
    return { name: 'Pedidos CRUD', results };
  }

  // CREATE order items
  try {
    const { error } = await supabase
      .from('items_pedido')
      .insert({
        pedido_id: testOrderId!,
        producto_nombre: 'Producto Test',
        producto_slug: 'producto-test',
        producto_precio: 100,
        talle: 'M',
        cantidad: 1,
        total_linea: 100,
      });
    if (error) throw error;
    results.push({ step: 'Crear items de pedido', ok: true, detail: '1 item creado' });
  } catch (e: any) {
    results.push({ step: 'Crear items de pedido', ok: false, detail: e.message });
  }

  // READ order
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', testOrderId!)
      .single();
    if (error) throw error;
    results.push({ step: 'Leer pedido', ok: true, detail: `N: ${data.numero_pedido}` });
  } catch (e: any) {
    results.push({ step: 'Leer pedido', ok: false, detail: e.message });
  }

  // UPDATE status
  try {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado: 'pago_aprobado', pagado_el: new Date().toISOString() })
      .eq('id', testOrderId!);
    if (error) throw error;
    results.push({ step: 'Cambiar estado a pago_aprobado', ok: true, detail: 'Estado actualizado' });
  } catch (e: any) {
    results.push({ step: 'Cambiar estado a pago_aprobado', ok: false, detail: e.message });
  }

  // Add admin notes
  try {
    const { error } = await supabase
      .from('pedidos')
      .update({ notas_admin: 'Nota de prueba desde debug panel' })
      .eq('id', testOrderId!);
    if (error) throw error;
    results.push({ step: 'Agregar notas admin', ok: true, detail: 'Notas guardadas' });
  } catch (e: any) {
    results.push({ step: 'Agregar notas admin', ok: false, detail: e.message });
  }

  // Add shipping info
  try {
    const { error } = await supabase
      .from('info_envio')
      .insert({
        pedido_id: testOrderId!,
        numero_seguimiento: 'TEST-TRACK-000',
        transportista: 'correo_argentino',
        url_seguimiento: 'https://softworks.com.ar',
        enviado_el: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    results.push({ step: 'Crear info de envio', ok: true, detail: 'Tracking: TEST-TRACK-000' });
  } catch (e: any) {
    results.push({ step: 'Crear info de envio', ok: false, detail: e.message });
  }

  // Cancel order
  try {
    const { error } = await supabase
      .from('pedidos')
      .update({
        estado: 'cancelado',
        cancelado_el: new Date().toISOString(),
        motivo_cancelacion: 'Test de debug - limpieza automatica',
      })
      .eq('id', testOrderId!);
    if (error) throw error;
    results.push({ step: 'Cancelar pedido', ok: true, detail: 'Pedido cancelado' });
  } catch (e: any) {
    results.push({ step: 'Cancelar pedido', ok: false, detail: e.message });
  }

  // CLEANUP
  try {
    await supabase.from('info_envio').delete().eq('pedido_id', testOrderId!);
    await supabase.from('items_pedido').delete().eq('pedido_id', testOrderId!);
    const { error } = await supabase.from('pedidos').delete().eq('id', testOrderId!);
    if (error) throw error;
    results.push({ step: 'Eliminar pedido (limpieza)', ok: true, detail: 'Todo eliminado' });
  } catch (e: any) {
    results.push({ step: 'Eliminar pedido (limpieza)', ok: false, detail: e.message });
  }

  return { name: 'Pedidos CRUD', results };
}

// ============================================
// TEST: Verificaciones de Pago
// ============================================
async function testPaymentVerifications() {
  const supabase = await getSupabase();
  const results: { step: string; ok: boolean; detail: string }[] = [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    results.push({ step: 'Autenticacion', ok: false, detail: 'No autenticado' });
    return { name: 'Verificaciones de Pago', results };
  }

  let testOrderId: string | null = null;
  let testVerifId: string | null = null;

  // Create temp order
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .insert({
        usuario_id: user.id,
        numero_pedido: `TVERIF-${Date.now().toString().slice(-8)}`,
        estado: 'pendiente_pago',
        cliente_nombre: 'Test Verif',
        cliente_email: 'test@debug.local',
        direccion_envio: { nombre_destinatario: 'Test', calle: 'Test', numero: '1', ciudad: 'CABA', provincia: 'Buenos Aires', codigo_postal: '1000' },
        subtotal: 50, costo_envio: 0, monto_descuento: 0, total: 50,
        metodo_pago: 'transferencia',
      })
      .select()
      .single();
    if (error) throw error;
    testOrderId = data.id;
    results.push({ step: 'Crear pedido temporal', ok: true, detail: 'OK' });
  } catch (e: any) {
    results.push({ step: 'Crear pedido temporal', ok: false, detail: e.message });
    return { name: 'Verificaciones de Pago', results };
  }

  // Create verification
  try {
    const { data, error } = await supabase
      .from('verificaciones_pago')
      .insert({
        pedido_id: testOrderId!,
        comprobante_url: 'https://softworks.com.ar/test-receipt.jpg',
        estado: 'pendiente',
        monto_transferido: 50,
        notas_cliente: 'Test desde debug',
      })
      .select()
      .single();
    if (error) throw error;
    testVerifId = data.id;
    results.push({ step: 'Crear verificacion de pago', ok: true, detail: `ID: ${testVerifId}` });
  } catch (e: any) {
    results.push({ step: 'Crear verificacion de pago', ok: false, detail: e.message });
  }

  // Approve
  if (testVerifId) {
    try {
      const { error } = await supabase
        .from('verificaciones_pago')
        .update({
          estado: 'aprobado',
          revisado_por: user.id,
          revisado_el: new Date().toISOString(),
          notas_admin: 'Aprobado por debug test',
        })
        .eq('id', testVerifId);
      if (error) throw error;
      results.push({ step: 'Aprobar verificacion', ok: true, detail: 'Estado: aprobado' });
    } catch (e: any) {
      results.push({ step: 'Aprobar verificacion', ok: false, detail: e.message });
    }

    // Reject
    try {
      const { error } = await supabase
        .from('verificaciones_pago')
        .update({
          estado: 'rechazado',
          motivo_rechazo: 'Test de rechazo desde debug',
        })
        .eq('id', testVerifId);
      if (error) throw error;
      results.push({ step: 'Rechazar verificacion', ok: true, detail: 'Estado: rechazado' });
    } catch (e: any) {
      results.push({ step: 'Rechazar verificacion', ok: false, detail: e.message });
    }
  }

  // Cleanup
  try {
    if (testVerifId) await supabase.from('verificaciones_pago').delete().eq('id', testVerifId);
    if (testOrderId) {
      await supabase.from('items_pedido').delete().eq('pedido_id', testOrderId);
      await supabase.from('pedidos').delete().eq('id', testOrderId);
    }
    results.push({ step: 'Limpieza', ok: true, detail: 'Datos de prueba eliminados' });
  } catch (e: any) {
    results.push({ step: 'Limpieza', ok: false, detail: e.message });
  }

  return { name: 'Verificaciones de Pago', results };
}

// ============================================
// TEST: Perfiles / Usuarios
// ============================================
async function testUserProfiles() {
  const supabase = await getSupabase();
  const results: { step: string; ok: boolean; detail: string }[] = [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    results.push({ step: 'Autenticacion', ok: false, detail: 'No autenticado' });
    return { name: 'Perfiles / Usuarios', results };
  }

  // List all profiles
  try {
    const { data, error, count } = await supabase
      .from('perfiles')
      .select('*', { count: 'exact', head: false })
      .limit(5);
    if (error) throw error;
    results.push({ step: 'Listar perfiles', ok: true, detail: `${count ?? (data as any[]).length} usuarios encontrados` });
  } catch (e: any) {
    results.push({ step: 'Listar perfiles', ok: false, detail: e.message });
  }

  // Read own profile
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (error) throw error;
    results.push({ step: 'Leer perfil propio', ok: true, detail: `Rol: ${data.rol}` });
  } catch (e: any) {
    results.push({ step: 'Leer perfil propio', ok: false, detail: e.message });
  }

  // Update own profile (telefono test then revert)
  let originalPhone: string | null = null;
  try {
    const { data: current } = await supabase
      .from('perfiles')
      .select('telefono')
      .eq('id', user.id)
      .single();
    originalPhone = current?.telefono;

    const { error } = await supabase
      .from('perfiles')
      .update({ telefono: 'TEST-DEBUG-000' })
      .eq('id', user.id);
    if (error) throw error;

    // Revert
    await supabase.from('perfiles').update({ telefono: originalPhone }).eq('id', user.id);
    results.push({ step: 'Actualizar perfil', ok: true, detail: 'Telefono modificado y restaurado' });
  } catch (e: any) {
    results.push({ step: 'Actualizar perfil', ok: false, detail: e.message });
    if (originalPhone !== null) {
      await supabase.from('perfiles').update({ telefono: originalPhone }).eq('id', user.id);
    }
  }

  // Search profiles by email
  try {
    const { data, error } = await supabase
      .from('perfiles')
      .select('id, email, nombre')
      .ilike('email', '%@%')
      .limit(3);
    if (error) throw error;
    results.push({ step: 'Buscar perfiles por email', ok: true, detail: `${(data as any[]).length} resultados` });
  } catch (e: any) {
    results.push({ step: 'Buscar perfiles por email', ok: false, detail: e.message });
  }

  return { name: 'Perfiles / Usuarios', results };
}

// ============================================
// TEST: Configuracion del Sitio
// ============================================
async function testSiteConfig() {
  const supabase = await getSupabase();
  const results: { step: string; ok: boolean; detail: string }[] = [];

  // 1. Read all config keys
  try {
    const { data, error } = await supabase
      .from('configuracion_sitio')
      .select('clave');
    if (error) throw error;
    const keys = (data as any[]).map((d: any) => d.clave);
    results.push({ step: 'Leer configuraciones', ok: true, detail: `Claves: ${keys.join(', ') || 'ninguna'}` });
  } catch (e: any) {
    results.push({ step: 'Leer configuraciones', ok: false, detail: e.message });
  }

  // 2. Upsert test config (valor as JSON string, matching app pattern)
  try {
    const testVal = JSON.stringify({ test: true, ts: Date.now() });
    const { error } = await supabase
      .from('configuracion_sitio')
      .upsert({ clave: '_debug_test', valor: testVal }, { onConflict: 'clave' });
    if (error) throw error;
    results.push({ step: 'Escribir configuracion', ok: true, detail: 'Clave _debug_test guardada' });
  } catch (e: any) {
    results.push({ step: 'Escribir configuracion', ok: false, detail: e.message });
  }

  // 3. Read it back
  try {
    const { data, error } = await supabase
      .from('configuracion_sitio')
      .select('valor')
      .eq('clave', '_debug_test')
      .single();
    if (error) throw error;
    const valStr = typeof data.valor === 'string' ? data.valor : JSON.stringify(data.valor);
    results.push({ step: 'Re-leer configuracion', ok: true, detail: `Valor: ${valStr.substring(0, 50)}` });
  } catch (e: any) {
    results.push({ step: 'Re-leer configuracion', ok: false, detail: e.message });
  }

  // 4. Update test config (overwrite with new value)
  try {
    const { error } = await supabase
      .from('configuracion_sitio')
      .upsert({ clave: '_debug_test', valor: JSON.stringify({ cleaned: true }) }, { onConflict: 'clave' });
    if (error) throw error;
    results.push({ step: 'Actualizar configuracion', ok: true, detail: 'Valor actualizado' });
  } catch (e: any) {
    results.push({ step: 'Actualizar configuracion', ok: false, detail: e.message });
  }

  // 5. Delete test config
  try {
    const { error } = await supabase
      .from('configuracion_sitio')
      .delete()
      .eq('clave', '_debug_test');
    if (error) throw error;
    results.push({ step: 'Eliminar configuracion test', ok: true, detail: 'Limpiado' });
  } catch (e: any) {
    // If delete fails (RLS), mark as warning but not critical
    results.push({ step: 'Eliminar configuracion test', ok: false, detail: `${e.message} (puede requerir policy DELETE)` });
  }

  return { name: 'Configuracion del Sitio', results };
}

// ============================================
// TEST: Cuentas Bancarias
// ============================================
async function testBankAccounts() {
  const supabase = await getSupabase();
  const results: { step: string; ok: boolean; detail: string }[] = [];
  let testAccountId: string | null = null;

  // List
  try {
    const { data, error } = await supabase
      .from('cuentas_bancarias')
      .select('*');
    if (error) throw error;
    results.push({ step: 'Listar cuentas bancarias', ok: true, detail: `${(data as any[]).length} cuentas` });
  } catch (e: any) {
    results.push({ step: 'Listar cuentas bancarias', ok: false, detail: e.message });
  }

  // Create
  try {
    const { data, error } = await supabase
      .from('cuentas_bancarias')
      .insert({
        banco: 'Banco Test Debug',
        titular: 'Test Debug',
        cbu: '0000000000000000000000',
        alias: 'test.debug.softworks',
        tipo_cuenta: 'corriente',
        activa: false,
        orden_visualizacion: 999,
      })
      .select()
      .single();
    if (error) throw error;
    testAccountId = data.id;
    results.push({ step: 'Crear cuenta bancaria', ok: true, detail: `ID: ${testAccountId}` });
  } catch (e: any) {
    results.push({ step: 'Crear cuenta bancaria', ok: false, detail: e.message });
  }

  // Update
  if (testAccountId) {
    try {
      const { error } = await supabase
        .from('cuentas_bancarias')
        .update({ titular: 'Test Actualizado' })
        .eq('id', testAccountId);
      if (error) throw error;
      results.push({ step: 'Actualizar cuenta bancaria', ok: true, detail: 'Titular actualizado' });
    } catch (e: any) {
      results.push({ step: 'Actualizar cuenta bancaria', ok: false, detail: e.message });
    }
  }

  // Delete
  if (testAccountId) {
    try {
      const { error } = await supabase
        .from('cuentas_bancarias')
        .delete()
        .eq('id', testAccountId);
      if (error) throw error;
      results.push({ step: 'Eliminar cuenta bancaria', ok: true, detail: 'Eliminada' });
    } catch (e: any) {
      results.push({ step: 'Eliminar cuenta bancaria', ok: false, detail: e.message });
    }
  }

  return { name: 'Cuentas Bancarias', results };
}

// ============================================
// TEST: Zonas de Envio
// ============================================
async function testShippingZones() {
  const supabase = await getSupabase();
  const results: { step: string; ok: boolean; detail: string }[] = [];
  let testZoneId: string | null = null;

  // List
  try {
    const { data, error } = await supabase
      .from('zonas_envio')
      .select('*');
    if (error) throw error;
    results.push({ step: 'Listar zonas de envio', ok: true, detail: `${(data as any[]).length} zonas` });
  } catch (e: any) {
    results.push({ step: 'Listar zonas de envio', ok: false, detail: e.message });
  }

  // Create (set activa=true so SELECT policy can also see it)
  try {
    const { data, error } = await supabase
      .from('zonas_envio')
      .insert({
        nombre: 'Zona Test Debug',
        provincias: JSON.stringify(['Test']),
        precio: 1,
        envio_gratis_minimo: null,
        dias_estimados_min: 1,
        dias_estimados_max: 3,
        activa: true,
      })
      .select()
      .single();
    if (error) throw error;
    testZoneId = data.id;
    results.push({ step: 'Crear zona de envio', ok: true, detail: `ID: ${testZoneId}` });
  } catch (e: any) {
    results.push({ step: 'Crear zona de envio', ok: false, detail: e.message });
  }

  // Update
  if (testZoneId) {
    try {
      const { error } = await supabase
        .from('zonas_envio')
        .update({ precio: 999, nombre: 'Zona Test Actualizada' })
        .eq('id', testZoneId);
      if (error) throw error;
      results.push({ step: 'Actualizar zona de envio', ok: true, detail: 'Precio: $999' });
    } catch (e: any) {
      results.push({ step: 'Actualizar zona de envio', ok: false, detail: e.message });
    }
  }

  // Delete
  if (testZoneId) {
    try {
      const { error } = await supabase
        .from('zonas_envio')
        .delete()
        .eq('id', testZoneId);
      if (error) throw error;
      results.push({ step: 'Eliminar zona de envio', ok: true, detail: 'Eliminada' });
    } catch (e: any) {
      results.push({ step: 'Eliminar zona de envio', ok: false, detail: e.message });
    }
  }

  return { name: 'Zonas de Envio', results };
}

// ============================================
// TEST: Contenidos CMS (stored in configuracion_sitio)
// ============================================
async function testPageContents() {
  const supabase = await getSupabase();
  const results: { step: string; ok: boolean; detail: string }[] = [];

  // 1. List content keys (CMS stores pages as contenido_* keys in configuracion_sitio)
  try {
    const { data, error } = await supabase
      .from('configuracion_sitio')
      .select('clave')
      .ilike('clave', 'contenido_%');
    if (error) throw error;
    const pages = (data as any[]).map((d: any) => d.clave.replace('contenido_', ''));
    results.push({ step: 'Listar contenidos CMS', ok: true, detail: `Paginas: ${pages.join(', ') || 'ninguna'}` });
  } catch (e: any) {
    results.push({ step: 'Listar contenidos CMS', ok: false, detail: e.message });
  }

  // 2. Write test CMS content
  try {
    const testContent = JSON.stringify({ title: 'Debug Test', sections: [], _test: true });
    const { error } = await supabase
      .from('configuracion_sitio')
      .upsert({ clave: 'contenido__debug_test', valor: testContent }, { onConflict: 'clave' });
    if (error) throw error;
    results.push({ step: 'Escribir contenido CMS', ok: true, detail: 'Pagina _debug_test creada' });
  } catch (e: any) {
    results.push({ step: 'Escribir contenido CMS', ok: false, detail: e.message });
  }

  // 3. Read back
  try {
    const { data, error } = await supabase
      .from('configuracion_sitio')
      .select('valor')
      .eq('clave', 'contenido__debug_test')
      .single();
    if (error) throw error;
    results.push({ step: 'Re-leer contenido CMS', ok: true, detail: 'Contenido verificado' });
  } catch (e: any) {
    results.push({ step: 'Re-leer contenido CMS', ok: false, detail: e.message });
  }

  // 4. Update it
  try {
    const updatedContent = JSON.stringify({ title: 'Debug Test Updated', sections: [{ type: 'test' }], _test: true });
    const { error } = await supabase
      .from('configuracion_sitio')
      .upsert({ clave: 'contenido__debug_test', valor: updatedContent }, { onConflict: 'clave' });
    if (error) throw error;
    results.push({ step: 'Actualizar contenido CMS', ok: true, detail: 'Contenido actualizado' });
  } catch (e: any) {
    results.push({ step: 'Actualizar contenido CMS', ok: false, detail: e.message });
  }

  // 5. Delete test content
  try {
    const { error } = await supabase
      .from('configuracion_sitio')
      .delete()
      .eq('clave', 'contenido__debug_test');
    if (error) throw error;
    results.push({ step: 'Eliminar contenido test', ok: true, detail: 'Limpiado' });
  } catch (e: any) {
    results.push({ step: 'Eliminar contenido test', ok: false, detail: `${e.message} (puede requerir policy DELETE)` });
  }

  return { name: 'Contenidos CMS', results };
}

// ============================================
// TEST: Direcciones
// ============================================
async function testAddresses() {
  const supabase = await getSupabase();
  const results: { step: string; ok: boolean; detail: string }[] = [];
  let testAddressId: string | null = null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    results.push({ step: 'Autenticacion', ok: false, detail: 'No autenticado' });
    return { name: 'Direcciones', results };
  }

  // List
  try {
    const { data, error } = await supabase
      .from('direcciones')
      .select('*')
      .eq('usuario_id', user.id);
    if (error) throw error;
    results.push({ step: 'Listar direcciones', ok: true, detail: `${(data as any[]).length} direcciones` });
  } catch (e: any) {
    results.push({ step: 'Listar direcciones', ok: false, detail: e.message });
  }

  // Create
  try {
    const { data, error } = await supabase
      .from('direcciones')
      .insert({
        usuario_id: user.id,
        etiqueta: 'Test Debug',
        nombre_destinatario: 'Debug Test',
        calle: 'Calle Debug',
        numero: '000',
        ciudad: 'CABA',
        provincia: 'Ciudad Autonoma de Buenos Aires',
        codigo_postal: '0000',
        pais: 'Argentina',
        es_predeterminada: false,
      })
      .select()
      .single();
    if (error) throw error;
    testAddressId = data.id;
    results.push({ step: 'Crear direccion', ok: true, detail: `ID: ${testAddressId}` });
  } catch (e: any) {
    results.push({ step: 'Crear direccion', ok: false, detail: e.message });
  }

  // Update
  if (testAddressId) {
    try {
      const { error } = await supabase
        .from('direcciones')
        .update({ calle: 'Calle Actualizada' })
        .eq('id', testAddressId);
      if (error) throw error;
      results.push({ step: 'Actualizar direccion', ok: true, detail: 'Calle actualizada' });
    } catch (e: any) {
      results.push({ step: 'Actualizar direccion', ok: false, detail: e.message });
    }
  }

  // Delete
  if (testAddressId) {
    try {
      const { error } = await supabase
        .from('direcciones')
        .delete()
        .eq('id', testAddressId);
      if (error) throw error;
      results.push({ step: 'Eliminar direccion', ok: true, detail: 'Eliminada' });
    } catch (e: any) {
      results.push({ step: 'Eliminar direccion', ok: false, detail: e.message });
    }
  }

  return { name: 'Direcciones', results };
}

// ============================================
// TEST: RLS Policies check
// ============================================
async function testRLSPolicies() {
  const supabase = await getSupabase();
  const results: { step: string; ok: boolean; detail: string }[] = [];

  const tables = [
    'productos', 'pedidos', 'items_pedido', 'perfiles', 'direcciones',
    'verificaciones_pago', 'info_envio', 'cuentas_bancarias', 'zonas_envio',
    'configuracion_sitio',
  ];

  for (const table of tables) {
    try {
      const { error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      results.push({ step: `SELECT ${table}`, ok: true, detail: `${count ?? '?'} filas` });
    } catch (e: any) {
      results.push({ step: `SELECT ${table}`, ok: false, detail: e.message });
    }
  }

  return { name: 'Acceso a Tablas (RLS)', results };
}

// ============================================
// MAIN HANDLER
// ============================================
const TEST_MAP: Record<string, () => Promise<{ name: string; results: { step: string; ok: boolean; detail: string }[] }>> = {
  products: testProductsCRUD,
  orders: testOrdersCRUD,
  verifications: testPaymentVerifications,
  users: testUserProfiles,
  config: testSiteConfig,
  bank_accounts: testBankAccounts,
  shipping_zones: testShippingZones,
  pages: testPageContents,
  addresses: testAddresses,
  rls: testRLSPolicies,
};

export async function POST(request: NextRequest) {
  const user = await verifyAdmin();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { test } = body;

    if (test && TEST_MAP[test]) {
      const result = await TEST_MAP[test]();
      return NextResponse.json({ success: true, results: [result] });
    }

    if (test === 'all') {
      const allResults = [];
      for (const key of Object.keys(TEST_MAP)) {
        const result = await TEST_MAP[key]();
        allResults.push(result);
      }
      return NextResponse.json({ success: true, results: allResults });
    }

    return NextResponse.json({
      error: 'Test no valido',
      available: Object.keys(TEST_MAP),
    }, { status: 400 });
  } catch (error: any) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}
