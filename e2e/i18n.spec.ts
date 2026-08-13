import { test, expect } from '@playwright/test';
import { site, otherSite } from './helpers/site';

test('hreflang-Paare + x-default (Galerie)', async ({ page }, info) => {
  await page.goto(site(info).routes.gallery);
  const de = await page.locator('link[rel="alternate"][hreflang="de"]').getAttribute('href');
  const en = await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute('href');
  expect(de).toContain('haushoppe.de');
  expect(en).toContain('haushoppe.art');
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
});

test('Sprach-Flagge mappt Kategorie-, Camper- und Werk-Pfade korrekt', async ({ page }, info) => {
  const s = site(info);
  const o = otherSite(info);
  // Kategorie: /werke/holzschnitte/ ↔ /artwork/woodcuts/
  await page.goto(`${s.galleryBase}/${s.cats[0].slug}/`);
  expect(await page.getByTestId('lang-switch').getAttribute('href')).toContain(`${o.origin}${o.galleryBase}/${o.cats[0].slug}/`);
  // Camper (eigener Pfad je Sprache)
  await page.goto(s.camper.path);
  expect(await page.getByTestId('lang-switch').getAttribute('href')).toContain(`${o.origin}${o.camper.path}`);
  // Werk-Detail (Slug unterscheidet sich je Sprache)
  await page.goto(`/portfolio/${s.work.woodcut}/`);
  expect(await page.getByTestId('lang-switch').getAttribute('href')).toContain(`${o.origin}/portfolio/${o.work.woodcut}/`);
});
