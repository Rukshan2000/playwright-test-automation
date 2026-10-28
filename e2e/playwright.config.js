// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/student_crud_e2e';

// Set BASE_URL (and API_URL) to test a deployed app instead of local servers:
//   BASE_URL=https://my-app.com API_URL=https://api.my-app.com npm test
// In that mode no servers are started and no database is touched.
const DEPLOYED = Boolean(process.env.BASE_URL);

// Local mode: dedicated ports so the test servers never collide with your dev servers (4000 / 5173).
const APP_URL = process.env.BASE_URL || 'http://localhost:5273';
const API_URL = process.env.API_URL || (DEPLOYED ? APP_URL : 'http://localhost:4010');

module.exports = defineConfig({
  testDir: './specs',
  globalSetup: DEPLOYED ? undefined : require.resolve('./global-setup.js'),

  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,

  timeout: 45_000,
  expect: { timeout: 10_000 },

  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: APP_URL,
    actionTimeout: 10_000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    // `npm run test:slow` sets SLOW_MO so every action is delayed — no sleeps in tests.
    launchOptions: { slowMo: Number(process.env.SLOW_MO || 0) },
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // Playwright starts both servers, waits until they respond, and stops them afterwards.
  // reuseExistingServer: false -> always fresh servers wired to the E2E database.
  webServer: DEPLOYED ? undefined : [
    {
      command: 'npm start',
      cwd: '../backend',
      url: `${API_URL}/api/health`,
      reuseExistingServer: false,
      timeout: 30_000,
      env: { PORT: '4010', KNEX_ENV: 'e2e', E2E_DATABASE_URL },
    },
    {
      command: 'npx vite --port 5273 --strictPort',
      cwd: '../frontend',
      url: APP_URL,
      reuseExistingServer: false,
      timeout: 30_000,
      env: { VITE_API_URL: API_URL },
    },
  ],
});

module.exports.API_URL = API_URL;
module.exports.DEPLOYED = DEPLOYED;
module.exports.E2E_DATABASE_URL = E2E_DATABASE_URL;
