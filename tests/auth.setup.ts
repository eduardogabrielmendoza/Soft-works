import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_DIR = path.join(__dirname, '.auth');
const ADMIN_FILE = path.join(AUTH_DIR, 'admin.json');

setup.beforeAll(() => {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }
});

/**
 * Guarda el estado de sesión del admin en tests/.auth/admin.json
 * Requiere TEST_ADMIN_EMAIL y TEST_ADMIN_PASSWORD en el entorno.
 */
setup('autenticar admin', async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      '\n⚠ TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD no configurados.' +
        '\n  Los tests de admin serán saltados. Setear estas variables para habilitarlos.\n'
    );
    fs.writeFileSync(ADMIN_FILE, JSON.stringify({ cookies: [], origins: [] }));
    return;
  }

  await page.goto('/cuenta');

  // Llenar formulario de login
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/contraseña|password/i).fill(password);
  await page.getByRole('button', { name: /ingresar|iniciar sesión/i }).click();

  // Esperar redirección exitosa
  await page.waitForURL('**/cuenta/perfil', { timeout: 20_000 });

  // Guardar cookies y localStorage de Supabase
  await page.context().storageState({ path: ADMIN_FILE });
  console.log('✓ Auth admin guardado en tests/.auth/admin.json');
});
