import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

test('img-Fallbacks auf Kernseiten lösen 200 auf', async ({ page, request }, info) => {
  const s = site(info);
  for (const key of ['home', 'gallery', 'camping'] as const) {
    await page.goto(s.routes[key], { waitUntil: 'load' });
    const srcs = await page.locator('img').evaluateAll((imgs) => [
      ...new Set(
        (imgs as HTMLImageElement[]).map((im) => im.getAttribute('src')).filter((x): x is string => !!x && x.startsWith('/')),
      ),
    ]);
    for (const src of srcs.slice(0, 40)) {
      const r = await request.get(src);
      expect(r.status(), `Bild ${src} auf ${key}`).toBeLessThan(400);
    }
  }
});

test('AVIF/WebP-Derivate (<source srcset>) lösen 200 auf', async ({ page, request }, info) => {
  const s = site(info);
  await page.goto(s.routes.camping, { waitUntil: 'load' });
  const urls = await page.locator('picture source[srcset]').evaluateAll((els) => [
    ...new Set(
      (els as HTMLSourceElement[])
        .flatMap((e) => (e.getAttribute('srcset') || '').split(',').map((c) => c.trim().split(/\s+/)[0]))
        .filter((u) => u.startsWith('/')),
    ),
  ]);
  expect(urls.length, 'Camper hat <source>-Derivate').toBeGreaterThan(0);
  for (const u of urls.slice(0, 40)) {
    const r = await request.get(u);
    expect(r.status(), `Derivat ${u}`).toBeLessThan(400);
  }
});

test('Alle Navigations-Links lösen 200 auf', async ({ page, request }, info) => {
  await page.goto(site(info).routes.home);
  const hrefs = await page.getByTestId('nav-link').evaluateAll((els) => [
    ...new Set(
      (els as HTMLAnchorElement[]).map((e) => e.getAttribute('href')).filter((h): h is string => !!h && h.startsWith('/')),
    ),
  ]);
  expect(hrefs.length).toBeGreaterThan(3);
  for (const h of hrefs) {
    const r = await request.get(h);
    expect(r.status(), `Link ${h}`).toBeLessThan(400);
  }
});
