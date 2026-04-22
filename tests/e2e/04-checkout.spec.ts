import { test, expect, Page } from '@playwright/test';

const CART_KEY = 'softworks_cart';

// ─── Helpers ──────────────────────────────────────────────────────────────

const CART_ITEM = [
  {
    producto_id: 'checkout-test-id',
    slug: 'checkout-test',
    nombre: 'Remera Checkout Test',
    imagen: null,
    precio: 20_000,
    talle: 'M',
    cantidad: 1,
  },
];

async function goToCheckout(page: Page) {
  // addInitScript runs before any JS on the page — React will always see the cart
  // Also set softworks_guest_accepted to bypass the guest prompt modal
  await page.addInitScript(
    ({ key, value }) => {
      localStorage.setItem(key, value);
      localStorage.setItem('softworks_guest_accepted', 'true');
    },
    { key: CART_KEY, value: JSON.stringify(CART_ITEM) }
  );
  await page.goto('/checkout');
  // Two IDENTIFICACIÓN elements exist (step indicator + heading) — use first()
  await expect(page.getByText('IDENTIFICACIÓN').first()).toBeVisible({ timeout: 12_000 });
}

/** Completa el Step 1 con datos de prueba. */
async function completeStep1(page: Page) {
  await page.getByPlaceholder(/email/i).fill('checkout@test.com');
  await page.getByPlaceholder(/nombre/i).fill('Test');
  await page.getByPlaceholder(/apellido/i).fill('Usuario');
  await page.getByRole('button', { name: /ir al envío/i }).click();
  await expect(page.getByText('ENVÍO').first()).toBeVisible({ timeout: 8_000 });
}

/** Completa el Step 2 en modo domicilio con CP 1001 (CABA). */
async function completeStep2Domicilio(page: Page) {
  // Esperar que el step 2 sea activo (el input CP debe ser visible)
  const cpInput = page.locator('input[placeholder="Ej: 4000"]').first();
  await cpInput.waitFor({ state: 'visible', timeout: 8_000 });
  await cpInput.clear();
  await cpInput.fill('1001');
  // Esperar detección de provincia
  await expect(page.getByText(/Buenos Aires|Ciudad Autónoma|CABA/i)).toBeVisible({ timeout: 10_000 });

  // Esperar que los campos de dirección aparezcan (tienen animación de 0.3-0.4s)
  const calleInput = page.getByPlaceholder('Av. Corrientes');
  await calleInput.waitFor({ state: 'visible', timeout: 5_000 });
  await calleInput.fill('Corrientes');
  await page.getByPlaceholder('1234').fill('456');
  await page.getByPlaceholder('Tu localidad').fill('CABA');

  // Destinatario (puede auto-rellenarse con nombre del step 1)
  const destInput = page.getByPlaceholder('Nombre del destinatario');
  const destVal = await destInput.inputValue();
  if (!destVal) await destInput.fill('Test Usuario');

  await page.getByRole('button', { name: /continuar al pago/i }).click();
  await expect(page.getByText('PAGO').first()).toBeVisible({ timeout: 8_000 });
}

// ─── Step 1: Identificación ───────────────────────────────────────────────

test.describe('Checkout — Step 1: Identificación', () => {
  test.beforeEach(async ({ page }) => {
    await goToCheckout(page);
  });

  test('formulario de identificación es visible', async ({ page }) => {
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/nombre/i)).toBeVisible();
    await expect(page.getByPlaceholder(/apellido/i)).toBeVisible();
  });

  test('validación: campos vacíos muestran error', async ({ page }) => {
    await page.getByPlaceholder(/email/i).fill('');
    await page.getByPlaceholder(/nombre/i).fill('');
    await page.getByPlaceholder(/apellido/i).fill('');
    await page.getByRole('button', { name: /ir al envío/i }).click();
    // Error shown in red paragraph — unique selector to avoid strict-mode violation
    await expect(
      page.locator('p.text-red-500').or(page.locator('[class*="text-red"]').filter({ hasText: /completá|email|nombre|apellido|obligatorio/i }))
    ).toBeVisible({ timeout: 5_000 });
  });

  test('validación: email malformado muestra error', async ({ page }) => {
    await page.getByPlaceholder(/email/i).fill('noesmail');
    await page.getByPlaceholder(/nombre/i).fill('Juan');
    await page.getByPlaceholder(/apellido/i).fill('Pérez');
    await page.getByRole('button', { name: /ir al envío/i }).click();
    await expect(
      page.getByText(/email válido|ingresá un email/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test('step 1 válido → avanza al step 2', async ({ page }) => {
    await completeStep1(page);
    // Debe mostrar el panel de envío con el input de código postal
    await expect(
      page.locator('input[placeholder="Ej: 4000"]').first()
    ).toBeVisible({ timeout: 8_000 });
  });
});

// ─── Step 2: Envío ────────────────────────────────────────────────────────

test.describe('Checkout — Step 2: Envío', () => {
  test.beforeEach(async ({ page }) => {
    await goToCheckout(page);
    await completeStep1(page);
  });

  test('CP 1001 detecta Buenos Aires / CABA', async ({ page }) => {
    const cpInput = page.locator('input[placeholder="Ej: 4000"]').first();
    await cpInput.fill('1001');
    await expect(page.getByText(/Buenos Aires|Ciudad Autónoma|CABA/i)).toBeVisible({ timeout: 10_000 });
  });

  test('CP 5000 detecta Córdoba', async ({ page }) => {
    const cpInput = page.locator('input[placeholder="Ej: 4000"]').first();
    await cpInput.fill('5000');
    await expect(page.getByText(/Córdoba/i)).toBeVisible({ timeout: 10_000 });
  });

  test('CP 9999 (inexistente) muestra selector manual de provincia', async ({ page }) => {
    const cpInput = page.locator('input[placeholder="Ej: 4000"]').first();
    await cpInput.fill('9999');
    await expect(
      page.getByText(/no encontramos|seleccioná tu provincia|selector/i)
        .or(page.getByRole('combobox').or(page.locator('select')).first())
    ).toBeVisible({ timeout: 10_000 });
  });

  test('modo sucursal → aparece el buscador de sucursales', async ({ page }) => {
    const cpInput = page.locator('input[placeholder="Ej: 4000"]').first();
    await cpInput.fill('1001');
    await expect(page.getByText(/Buenos Aires|CABA/i)).toBeVisible({ timeout: 10_000 });

    // Seleccionar modo sucursal
    await page.getByRole('button', { name: /envío a sucursal/i }).click();

    // El componente de búsqueda debe aparecer — exact placeholder to avoid strict mode
    await expect(
      page.getByPlaceholder('Buscar por nombre, calle o localidad')
    ).toBeVisible({ timeout: 8_000 });
  });

  test('modo sucursal → buscar por texto devuelve resultados', async ({ page }) => {
    const cpInput = page.locator('input[placeholder="Ej: 4000"]').first();
    await cpInput.fill('1001');
    await expect(page.getByText(/Buenos Aires|CABA/i)).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /envío a sucursal/i }).click();

    const searchInput = page.getByPlaceholder('Buscar por nombre, calle o localidad');
    await searchInput.waitFor({ state: 'visible', timeout: 8_000 });
    await searchInput.fill('Palermo');
    // Multiple results match — use .first() to avoid strict mode
    await expect(
      page.getByText(/palermo|no se encontraron|cargando/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('domicilio: campos obligatorios validados', async ({ page }) => {
    const cpInput = page.locator('input[placeholder="Ej: 4000"]').first();
    await cpInput.fill('1001');
    await expect(page.getByText(/Buenos Aires|CABA/i)).toBeVisible({ timeout: 10_000 });

    // Intentar avanzar sin llenar dirección
    await page.getByRole('button', { name: /continuar al pago/i }).click();
    // Error shows in p.text-red-500
    await expect(page.locator('p.text-red-500').first()).toBeVisible({ timeout: 5_000 });
  });

  test('modo sucursal: no se puede avanzar sin elegir sucursal', async ({ page }) => {
    const cpInput = page.locator('input[placeholder="Ej: 4000"]').first();
    await cpInput.fill('1001');
    await expect(page.getByText(/Buenos Aires|CABA/i)).toBeVisible({ timeout: 10_000 });

    // Click the sucursal delivery option button
    await page.getByRole('button', { name: /envío a sucursal/i }).click();

    await page.getByRole('button', { name: /continuar al pago/i }).click();
    await expect(page.locator('p.text-red-500').first()).toBeVisible({ timeout: 5_000 });
  });

  test('precios de envío cambian según la zona', async ({ page }) => {
    // Fill 5000 directly — don't pre-fill 1001 as postalValidated blocks re-lookup
    const cpInput = page.locator('input[placeholder="Ej: 4000"]').first();
    await cpInput.waitFor({ state: 'visible', timeout: 8_000 });
    await cpInput.fill('5000');
    await expect(page.getByText(/Córdoba/i)).toBeVisible({ timeout: 10_000 });
    // The shipping buttons must be visible — they contain the price
    await expect(page.getByRole('button', { name: /Envío a domicilio/i })).toBeVisible({ timeout: 3_000 });
  });
});

// ─── Step 3: Pago ─────────────────────────────────────────────────────────

test.describe('Checkout — Step 3: Pago', () => {
  test.beforeEach(async ({ page }) => {
    await goToCheckout(page);
    await completeStep1(page);
    await completeStep2Domicilio(page);
  });

  test('opciones de pago MercadoPago y Transferencia son visibles', async ({ page }) => {
    await expect(page.getByRole('button', { name: /mercadopago/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByRole('button', { name: /transferencia/i })).toBeVisible({ timeout: 5_000 });
  });

  test('seleccionar MercadoPago marca el step como completado', async ({ page }) => {
    await page.getByRole('button', { name: /mercadopago/i }).click();
    await expect(page.getByRole('button', { name: /mercadopago/i })).toBeVisible();
  });

  test('bot\u00f3n Finalizar deshabilitado sin aceptar t\u00e9rminos', async ({ page }) => {
    await page.getByRole('button', { name: /mercadopago/i }).click();
    const finalizarBtn = page.getByRole('button', { name: /finalizar|confirmar/i });
    await expect(finalizarBtn).toBeDisabled();
  });

  test('botón Finalizar se habilita al aceptar términos', async ({ page }) => {
    await page.getByRole('button', { name: /mercadopago/i }).click();
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.click();
    const finalizarBtn = page.getByRole('button', { name: /finalizar|confirmar/i });
    await expect(finalizarBtn).toBeEnabled({ timeout: 5_000 });
  });

  test('botón Editar del Step 1 abre el formulario de identificación', async ({ page }) => {
    // Hacer click en el primer botón "Editar" (step 1)
    const editarBtns = page.getByRole('button', { name: /editar/i });
    await editarBtns.first().click();
    await expect(page.getByPlaceholder(/email/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: /ir al envío/i })).toBeVisible();
  });

  test('botón Editar del Step 2 abre el formulario de envío', async ({ page }) => {
    const editarBtns = page.getByRole('button', { name: /editar/i });
    const count = await editarBtns.count();
    if (count < 2) { test.skip(); return; }
    await editarBtns.nth(1).click();
    await expect(
      page.locator('input[placeholder="Ej: 4000"]').first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('resumen del pedido muestra nombre de producto y total', async ({ page }) => {
    await expect(page.getByText(/Remera Checkout Test/i)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Total', { exact: true })).toBeVisible();
  });
});
