import { test, expect } from '@playwright/test';

// ─── Páginas públicas ──────────────────────────────────────────────────────

const PUBLIC_PAGES = [
  '/colecciones',
  '/nosotros',
  '/contacto',
  '/eventos',
  '/ubicaciones',
  '/impacto',
  '/vlog',
  '/futuros-softworks',
  '/terminos-servicio',
  '/politica-privacidad',
  '/politica-cookies',
  '/preguntas-frecuentes',
  '/no-vender-informacion',
  '/accesibilidad',
];

for (const url of PUBLIC_PAGES) {
  test(`${url} — carga sin error`, async ({ page }) => {
    await page.goto(url);
    await expect(page).not.toHaveURL(/\/error|500/);
    await expect(page.getByText(/internal server error/i)).not.toBeVisible();
    await expect(page.getByText(/application error/i)).not.toBeVisible();
    // La página no debe estar en blanco
    await expect(page.locator('body')).not.toBeEmpty();
  });
}

// ─── Homepage ──────────────────────────────────────────────────────────────

test('homepage (/) — carga hero y navbar', async ({ page }) => {
  await page.goto('/');
  await expect(page).not.toHaveURL(/error/);
  // Navbar con logo o nombre
  await expect(page.getByText(/softworks/i).first()).toBeVisible({ timeout: 10_000 });
});

test('colecciones — muestra grid de productos', async ({ page }) => {
  await page.goto('/colecciones');
  await expect(page.getByRole('heading', { name: /colecciones/i })).toBeVisible({ timeout: 10_000 });
  // Debería haber al menos un enlace a producto
  const productLinks = page.locator('a[href^="/producto/"]');
  await expect(productLinks.first()).toBeVisible({ timeout: 10_000 });
});

test('colecciones — filtros por categoría funcionan', async ({ page }) => {
  await page.goto('/colecciones');
  // Wait for products to load and the filter button animation to complete
  await page.locator('a[href^="/producto/"]').first().waitFor({ timeout: 10_000 });
  const filterBtn = page.locator('button').filter({ hasText: /^Filtros$/ });
  await filterBtn.waitFor({ state: 'visible', timeout: 8_000 });
  await filterBtn.click();
  // Filter panel opens — wait for its heading
  const panelHeading = page.locator('h3').filter({ hasText: 'Filtrar por' });
  await panelHeading.waitFor({ state: 'visible', timeout: 8_000 });
  // Apply filters and verify no crash
  await page.locator('button').filter({ hasText: /^Aplicar$/ }).click();
  await expect(page.getByText(/application error/i)).not.toBeVisible({ timeout: 4_000 });
});

// ─── Página de producto ────────────────────────────────────────────────────

test('producto/[slug] — primer producto carga correctamente', async ({ page }) => {
  await page.goto('/colecciones');
  const firstProduct = page.locator('a[href^="/producto/"]').first();
  await firstProduct.waitFor({ timeout: 10_000 });
  const href = await firstProduct.getAttribute('href');
  await page.goto(href!);
  await expect(page).not.toHaveURL(/error/);
  // Debe mostrar precio
  await expect(page.getByText(/\$[\d.,]+/).first()).toBeVisible({ timeout: 10_000 });
});

// ─── Guardas de autenticación ──────────────────────────────────────────────

test('/cuenta — muestra formulario de login cuando no hay sesión', async ({ page }) => {
  await page.goto('/cuenta');
  await expect(page.getByPlaceholder(/email/i)).toBeVisible({ timeout: 8_000 });
});

test('/cuenta/perfil sin auth — redirige a /cuenta', async ({ page }) => {
  await page.goto('/cuenta/perfil');
  await page.waitForURL(/\/cuenta(?!\/perfil)/, { timeout: 10_000 });
  await expect(page).not.toHaveURL('/cuenta/perfil');
});

test('/cuenta/direcciones sin auth — redirige a /cuenta', async ({ page }) => {
  await page.goto('/cuenta/direcciones');
  await page.waitForURL(/\/cuenta(?!\/direcciones)/, { timeout: 10_000 });
  await expect(page).not.toHaveURL('/cuenta/direcciones');
});

test('/cuenta/pedidos sin auth — redirige a /cuenta', async ({ page }) => {
  await page.goto('/cuenta/pedidos');
  await page.waitForURL(/\/cuenta(?!\/pedidos)/, { timeout: 10_000 });
  await expect(page).not.toHaveURL('/cuenta/pedidos');
});

test('/admin sin auth — redirige fuera del panel', async ({ page }) => {
  await page.goto('/admin');
  await page.waitForURL(/^((?!\/admin).)*$/, { timeout: 10_000 });
  await expect(page).not.toHaveURL(/\/admin/);
});

// ─── Checkout vacío ───────────────────────────────────────────────────────

test('/checkout sin carrito — muestra pantalla de carrito vacío', async ({ page }) => {
  // Asegurar carrito vacío
  await page.addInitScript(() => localStorage.removeItem('softworks_cart'));
  await page.goto('/checkout');
  await expect(page.getByText(/carrito está vacío/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/ver colecciones/i)).toBeVisible();
});
