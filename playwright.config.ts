import { defineConfig, devices } from '@playwright/test';

// E2E gegen die gebauten statischen Sites: dist-de (haushoppe.de) auf :4321, dist-art
// (haushoppe.art) auf :4322. Projekte `de`/`en` (Desktop) + `de-mobile` (iPhone) für die
// mobilen Sonderlocken. Server via python http.server (kein Extra-Dependency).
const DE = 'http://localhost:4321';
const EN = 'http://localhost:4322';
const CI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Cross-Origin-Redirects (Sprach-Flagge → andere Domain) NICHT folgen; wir prüfen nur href.
    ignoreHTTPSErrors: true,
  },
  webServer: [
    { command: 'python3 -m http.server 4321 --directory dist-de', url: DE, reuseExistingServer: !CI, timeout: 60_000 },
    { command: 'python3 -m http.server 4322 --directory dist-art', url: EN, reuseExistingServer: !CI, timeout: 60_000 },
  ],
  projects: [
    { name: 'de', use: { ...devices['Desktop Chrome'], baseURL: DE, locale: 'de-DE' }, testIgnore: /mobile\.spec\.ts/ },
    { name: 'en', use: { ...devices['Desktop Chrome'], baseURL: EN, locale: 'en-US' }, testIgnore: /mobile\.spec\.ts/ },
    // Mobiles Projekt bewusst auf chromium-basiertem Pixel 5 (kein WebKit nötig; die mobilen
    // Sonderlocken sind CSS-Media-Queries, browser-agnostisch). Viewport 393px -> Burger + flush.
    { name: 'de-mobile', use: { ...devices['Pixel 5'], baseURL: DE, locale: 'de-DE' }, testMatch: /mobile\.spec\.ts/ },
    { name: 'en-mobile', use: { ...devices['Pixel 5'], baseURL: EN, locale: 'en-US' }, testMatch: /mobile\.spec\.ts/ },
  ],
});
