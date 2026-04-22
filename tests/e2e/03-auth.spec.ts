import { test, expect } from '@playwright/test';

// ─── Login inválido ────────────────────────────────────────────────────────

test.describe('Auth — Login con credenciales inválidas', () => {
  test('email y contraseña incorrectos muestran error en español', async ({ page }) => {
    await page.goto('/cuenta');
    await page.getByPlaceholder(/email/i).fill('noexiste_____@test.com');
    await page.locator('#password').fill('Contraseña_Incorrecta_999');
    await page.getByRole('button', { name: /entrar|ingresar|iniciar sesión/i }).click();
    // Error message is shown in a red div — unique to auth failure, not a label
    await expect(
      page.locator('.text-red-700, [class*="text-red-7"]').first()
    ).toBeVisible({ timeout: 15_000 });
    await expect(page).not.toHaveURL('/cuenta/perfil');
  });

  test('email malformado muestra error de validación', async ({ page }) => {
    await page.goto('/cuenta');
    // The email input has type="email" — browser validates format before submit
    const emailInput = page.getByPlaceholder(/email/i);
    await emailInput.fill('esto-no-es-un-email');
    // Check that HTML5 validation marks the field invalid (browser won't submit)
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) =>
      !el.validity.valid
    );
    expect(isInvalid).toBe(true);
    await expect(page).not.toHaveURL('/cuenta/perfil');
  });

  test('login no avanza con campos vacíos', async ({ page }) => {
    await page.goto('/cuenta');
    // Both fields are required — clicking submit without filling does nothing
    await page.getByRole('button', { name: /entrar|ingresar|iniciar sesión/i }).click();
    await expect(page).not.toHaveURL('/cuenta/perfil');
  });
});

// ─── Registro ─────────────────────────────────────────────────────────────

test.describe('Auth — Registro', () => {
  test('formulario de registro es accesible', async ({ page }) => {
    await page.goto('/cuenta/registro');
    await expect(page).not.toHaveURL(/error/);
    await expect(page.getByPlaceholder(/email/i)).toBeVisible({ timeout: 8_000 });
  });

  test('registro con campos vacíos muestra validación', async ({ page }) => {
    await page.goto('/cuenta/registro');
    // The submit button is disabled when password/confirm fields are empty
    const submitBtn = page.getByRole('button', { name: /crear cuenta/i });
    await expect(submitBtn).toBeVisible({ timeout: 8_000 });
    await expect(submitBtn).toBeDisabled();
  });

  test('registro con email ya existente muestra error', async ({ page }) => {
    const existingEmail = process.env.TEST_ADMIN_EMAIL || process.env.TEST_USER_EMAIL;
    if (!existingEmail) { test.skip(); return; }

    await page.goto('/cuenta/registro');
    await page.getByPlaceholder(/email/i).fill(existingEmail);
    // Llenar campos mínimos
    const pwdFields = page.getByPlaceholder(/contraseña|password/i);
    await pwdFields.first().fill('TestPassword123!');
    if (await pwdFields.count() > 1) {
      await pwdFields.nth(1).fill('TestPassword123!');
    }
    await page.getByPlaceholder(/nombre/i).first().fill('Test');
    await page.getByPlaceholder(/apellido/i).first().fill('Existente');
    await page.getByRole('button', { name: /registrarse|crear cuenta/i }).click();
    await expect(
      page.getByText(/ya registrado|ya existe|email.*uso|user already/i)
    ).toBeVisible({ timeout: 10_000 });
  });
});

// ─── Guardas de rutas ─────────────────────────────────────────────────────

test.describe('Auth — Guardas de rutas', () => {
  test('/cuenta/perfil redirige cuando no hay sesión', async ({ page }) => {
    await page.goto('/cuenta/perfil');
    await page.waitForURL(/\/cuenta/, { timeout: 10_000 });
    await expect(page).not.toHaveURL(/\/cuenta\/perfil/);
  });

  test('/cuenta/direcciones redirige cuando no hay sesión', async ({ page }) => {
    await page.goto('/cuenta/direcciones');
    await page.waitForURL(/\/cuenta/, { timeout: 10_000 });
    await expect(page).not.toHaveURL(/\/cuenta\/direcciones/);
  });

  test('/cuenta/pedidos redirige cuando no hay sesión', async ({ page }) => {
    await page.goto('/cuenta/pedidos');
    await page.waitForURL(/\/cuenta/, { timeout: 10_000 });
    await expect(page).not.toHaveURL(/\/cuenta\/pedidos/);
  });

  test('/admin/* redirige cuando no hay sesión o no es admin', async ({ page }) => {
    for (const route of ['/admin', '/admin/productos', '/admin/pedidos', '/admin/configuracion']) {
      await page.goto(route);
      await page.waitForURL(/^((?!\/admin).)*$/, { timeout: 10_000 });
      await expect(page).not.toHaveURL(/\/admin/);
    }
  });
});

// ─── Reset de contraseña ──────────────────────────────────────────────────

test.describe('Auth — Reset de contraseña', () => {
  test('página de reset-password carga correctamente', async ({ page }) => {
    await page.goto('/cuenta/reset-password');
    await expect(page).not.toHaveURL(/error/);
    await expect(page.getByPlaceholder(/email/i)).toBeVisible({ timeout: 8_000 });
  });

  test('email desconocido en reset no bloquea la UI', async ({ page }) => {
    await page.goto('/cuenta/reset-password');
    await page.getByPlaceholder(/email/i).fill('noexiste_test@ejemplo.com');
    await page.getByRole('button', { name: /enviar|continuar|siguiente/i }).click();
    // No debería mostrar un error 500
    await expect(page.getByText(/application error|internal server/i)).not.toBeVisible({ timeout: 6_000 });
    // Debe responder (éxito o error suave)
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('login exitoso con TEST_USER_EMAIL redirige a /cuenta/perfil', async ({ page }) => {
    const email = process.env.TEST_USER_EMAIL || process.env.TEST_ADMIN_EMAIL;
    const password = process.env.TEST_USER_PASSWORD || process.env.TEST_ADMIN_PASSWORD;
    if (!email || !password) { test.skip(); return; }

    await page.goto('/cuenta');
    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/contraseña|password/i).fill(password);
    await page.getByRole('button', { name: /ingresar|iniciar sesión/i }).click();
    await page.waitForURL('**/cuenta/perfil', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/cuenta\/perfil/);
  });
});
