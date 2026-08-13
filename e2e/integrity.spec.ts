import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

test('Bilder auf Kernseiten lösen 200 auf (kein 404-Asset)', async ({ page, request }, info) => {
  // Bewusst per HTTP-Status statt naturalWidth: viewBox-only-SVGs (Logo) melden naturalWidth 0,
  // rendern aber korrekt — HTTP prüft, was wirklich zählt (Asset existiert).
  const s = site(info);
  for (const key of ['home', 'gallery', 'camping'] as const) {
    await page.goto(s.routes[key], { waitUntil: 'load' });
    const srcs = await page.locator('img').evaluateAll((imgs) => [
      ...new Set(
        (imgs as HTMLImageElement[])
          .map((im) => im.getAttribute('src'))
          .filter((x): x is string => !!x && x.startsWith('/')),
      ),
    ]);
    for (const src of srcs.slice(0, 40)) {
      const r = await request.get(src);
      expect(r.status(), `Bild ${src} auf ${key}`).toBeLessThan(400);
    }
  }
});

test('Alle Navigations-Links lösen 200 auf', async ({ page, request }, info) => {
  await page.goto(site(info).routes.home);
  const hrefs = await page.getByTestId('nav-link').evaluateAll((els) => [
    ...new Set(
      (els as HTMLAnchorElement[])
        .map((e) => e.getAttribute('href'))
        .filter((h): h is string => !!h && h.startsWith('/')),
    ),
  ]);
  expect(hrefs.length).toBeGreaterThan(3);
  for (const h of hrefs) {
    const r = await request.get(h);
    expect(r.status(), `Link ${h}`).toBeLessThan(400);
  }
});
