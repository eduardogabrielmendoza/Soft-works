import { test, expect } from '@playwright/test';

/**
 * Tests del panel de admin.
 * Requieren: TEST_ADMIN_EMAIL + TEST_ADMIN_PASSWORD → npx playwright test --project=admin
 *
 * Estos tests usan la sesión guardada por auth.setup.ts en tests/.auth/admin.json
 */

// ─── Dashboard ────────────────────────────────────────────────────────────

test.describe('Admin — Dashboard', () => {
  test('dashboard carga con KPIs visibles', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).not.toHaveURL(/\/(cuenta|error)/);
    // Debería mostrar algún indicador de pedidos o ventas
    await expect(
      page.getByText(/pedidos|ventas|usuarios|ingresos/i).first()
    ).toBeVisible({ timeout: 12_000 });
  });

  test('navbar del admin contiene enlaces a secciones', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('link', { name: /productos/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('link', { name: /pedidos/i })).toBeVisible();
  });
});

// ─── Productos ────────────────────────────────────────────────────────────

test.describe('Admin — Productos', () => {
  test('lista de productos carga', async ({ page }) => {
    await page.goto('/admin/productos');
    await expect(page).not.toHaveURL(/error/);
    await expect(
      page.getByRole('heading', { name: /productos/i }).or(page.getByText(/nuevo producto/i))
    ).toBeVisible({ timeout: 12_000 });
  });

  test('buscar productos filtra la lista', async ({ page }) => {
    await page.goto('/admin/productos');
    const searchInput = page.getByPlaceholder(/buscar|search/i).first();
    if (await searchInput.count()) {
      await searchInput.fill('remera');
      await page.waitForTimeout(600);
      await expect(page.getByText(/application error/i)).not.toBeVisible({ timeout: 4_000 });
    }
  });

  test('link "Nuevo Producto" navega al formulario', async ({ page }) => {
    await page.goto('/admin/productos');
    await page
      .getByRole('link', { name: /nuevo producto/i })
      .or(page.getByRole('button', { name: /nuevo/i }))
      .first()
      .click();
    await page.waitForURL(/\/admin\/productos\/nuevo/, { timeout: 10_000 });
  });

  test('formulario de nuevo producto tiene campos requeridos', async ({ page }) => {
    await page.goto('/admin/productos/nuevo');
    await expect(
      page.getByLabel(/nombre/i).or(page.getByPlaceholder(/nombre del producto/i))
    ).toBeVisible({ timeout: 8_000 });
    await expect(
      page.getByLabel(/precio/i).or(page.getByPlaceholder(/precio/i))
    ).toBeVisible();
    await expect(page.getByRole('combobox').or(page.locator('select'))).toBeVisible();
  });

  test('filtro por categoría funciona', async ({ page }) => {
    await page.goto('/admin/productos');
    const filterSelect = page
      .getByRole('combobox')
      .or(page.locator('select'))
      .first();
    if (await filterSelect.count()) {
      await filterSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      await expect(page.getByText(/application error/i)).not.toBeVisible({ timeout: 4_000 });
    }
  });
});

// ─── Pedidos ──────────────────────────────────────────────────────────────

test.describe('Admin — Pedidos', () => {
  test('lista de pedidos carga', async ({ page }) => {
    await page.goto('/admin/pedidos');
    await expect(page).not.toHaveURL(/error/);
    await expect(
      page.getByRole('heading', { name: /pedidos/i }).or(page.getByText(/número de pedido|estado/i))
    ).toBeVisible({ timeout: 12_000 });
  });

  test('filtro de estado funciona', async ({ page }) => {
    await page.goto('/admin/pedidos');
    const filterSelect = page
      .getByRole('combobox')
      .or(page.locator('select'))
      .first();
    if (await filterSelect.count()) {
      await filterSelect.selectOption({ index: 1 });
      await page.waitForTimeout(600);
      await expect(page.getByText(/application error/i)).not.toBeVisible({ timeout: 4_000 });
    }
  });

  test('click en pedido abre el detalle', async ({ page }) => {
    await page.goto('/admin/pedidos');
    const pedidoLink = page.locator('a[href^="/admin/pedidos/"]').first();
    if (await pedidoLink.count()) {
      await pedidoLink.click();
      await page.waitForURL(/\/admin\/pedidos\/[^/]+$/, { timeout: 10_000 });
      await expect(page).not.toHaveURL(/error/);
    } else {
      test.skip(); // No hay pedidos en la base de datos
    }
  });
});

// ─── Verificaciones ───────────────────────────────────────────────────────

test.describe('Admin — Verificaciones de pago', () => {
  test('página de verificaciones carga', async ({ page }) => {
    await page.goto('/admin/verificaciones');
    await expect(page).not.toHaveURL(/error/);
    await expect(
      page
        .getByRole('heading', { name: /verificaciones|comprobantes/i })
        .or(page.getByText(/pendientes|verificar|transferencias/i))
    ).toBeVisible({ timeout: 12_000 });
  });
});

// ─── Usuarios ─────────────────────────────────────────────────────────────

test.describe('Admin — Usuarios', () => {
  test('lista de usuarios carga', async ({ page }) => {
    await page.goto('/admin/usuarios');
    await expect(page).not.toHaveURL(/error/);
    await expect(
      page
        .getByRole('heading', { name: /usuarios/i })
        .or(page.getByText(/email|rol|nombre/i))
    ).toBeVisible({ timeout: 12_000 });
  });
});

// ─── Configuración ────────────────────────────────────────────────────────

test.describe('Admin — Configuración', () => {
  test('página de configuración carga', async ({ page }) => {
    await page.goto('/admin/configuracion');
    await expect(page).not.toHaveURL(/error/);
    await expect(
      page.getByRole('heading', { name: /configuraci[oó]n/i })
    ).toBeVisible({ timeout: 12_000 });
  });

  test('sección de envíos es visible', async ({ page }) => {
    await page.goto('/admin/configuracion');
    await expect(page.getByText(/tarifa|envío|zona|shipping/i)).toBeVisible({ timeout: 10_000 });
  });

  test('sección de pagos es visible', async ({ page }) => {
    await page.goto('/admin/configuracion');
    await expect(page.getByText(/pago|mercadopago|transferencia/i)).toBeVisible({ timeout: 10_000 });
  });

  test('cambiar umbral de envío gratis y guardar', async ({ page }) => {
    await page.goto('/admin/configuracion');

    const umbraInput = page
      .getByLabel(/envío gratis|free shipping/i)
      .or(page.getByPlaceholder(/envío gratis/i))
      .first();

    if (!(await umbraInput.count())) { test.skip(); return; }

    const originalValue = await umbraInput.inputValue();
    const newValue = String(Number(originalValue || '0') + 1000);
    await umbraInput.fill(newValue);

    await page.getByRole('button', { name: /guardar/i }).first().click();
    await expect(
      page.getByText(/guardado|éxito|saved|actualizado/i)
    ).toBeVisible({ timeout: 10_000 });

    // Restaurar valor original
    await umbraInput.fill(originalValue);
    await page.getByRole('button', { name: /guardar/i }).first().click();
  });
});

// ─── CMS Contenidos ───────────────────────────────────────────────────────

test.describe('Admin — CMS Contenidos', () => {
  test('editor de contenidos carga', async ({ page }) => {
    await page.goto('/admin/contenidos');
    await expect(page).not.toHaveURL(/error/);
    await expect(
      page
        .getByRole('heading', { name: /contenidos|editor/i })
        .or(page.getByText(/página|sección|inicio/i))
    ).toBeVisible({ timeout: 12_000 });
  });

  test('selector de página funciona', async ({ page }) => {
    await page.goto('/admin/contenidos');
    const pageSelector = page.getByRole('combobox').or(page.locator('select')).first();
    if (await pageSelector.count()) {
      await pageSelector.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      await expect(page.getByText(/application error/i)).not.toBeVisible({ timeout: 4_000 });
    }
  });
});

// ─── Debug ────────────────────────────────────────────────────────────────

test.describe('Admin — Debug', () => {
  test('página de debug carga y muestra diagnósticos', async ({ page }) => {
    await page.goto('/admin/debug');
    await expect(page).not.toHaveURL(/error/);
    await expect(
      page.getByText(/diagnóstico|debug|email|supabase/i)
    ).toBeVisible({ timeout: 12_000 });
  });
});
