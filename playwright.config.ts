import { defineConfig, devices } from '@playwright/test';

/**
 * SOFTWORKS — E2E Test Suite (~70% del checklist manual)
 *
 * Cobertura:
 *   ✅ Páginas públicas (todas las rutas)
 *   ✅ Carrito (CRUD, persistencia localStorage)
 *   ✅ Auth flows (login, errores, guardas de rutas)
 *   ✅ Checkout wizard (Steps 1-3, validaciones, CP, sucursales)
 *   ✅ Draft persistence (sessionStorage, cambio de pestaña)
 *   ✅ Admin panel (productos, pedidos, config, verificaciones, usuarios)
 *   ✅ Mobile viewport (páginas y carrito)
 *
 *   ❌ Entrega real de emails (Mailjet)
 *   ❌ Pago real MercadoPago + webhook
 *   ❌ Aprobación/rechazo manual de transferencias
 *   ❌ Fidelidad visual pixel-perfect cross-browser
 *
 * Variables de entorno requeridas (crear .env.test o exportar en shell):
 *   BASE_URL             – URL del sitio (default: http://localhost:3000)
 *   TEST_ADMIN_EMAIL     – email de usuario con rol admin
 *   TEST_ADMIN_PASSWORD  – contraseña del admin
 *   TEST_USER_EMAIL      – email de usuario regular (opcional)
 *   TEST_USER_PASSWORD   – contraseña del usuario regular (opcional)
 *
 * Uso:
 *   npx playwright test              → correr todos
 *   npx playwright test --ui         → modo UI interactivo
 *   npx playwright test 01-pages     → solo ese archivo
 *   npx playwright test --project=admin → solo tests de admin
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'tests/playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // ── 1. Setup: crea los archivos de auth (solo si TEST_ADMIN_* están seteados) ──
    {
      name: 'auth-setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── 2. Tests públicos (sin auth) ──
    {
      name: 'public',
      testMatch: /0[1-5]-.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/public-cookies.json',
      },
    },

    // ── 3. Tests de admin (necesitan admin auth) ──
    {
      name: 'admin',
      testMatch: /06-admin\.spec\.ts/,
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/.auth/admin.json',
      },
    },

    // ── 4. Mobile: páginas y carrito ──
    {
      name: 'mobile',
      testMatch: /0[12]-.*\.spec\.ts/,
      use: { ...devices['Pixel 7'] },
    },
  ],

  // Auto-arranca el servidor de desarrollo si no hay BASE_URL externo
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 90_000,
      },
});
