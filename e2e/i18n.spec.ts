import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

test('hreflang-Paare + Sprach-Flagge zeigen auf die richtige Domain', async ({ page }, info) => {
  const s = site(info);
  await page.goto(s.routes.gallery);
  const de = await page.locator('link[rel="alternate"][hreflang="de"]').getAttribute('href');
  const en = await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute('href');
  expect(de).toContain('haushoppe.de');
  expect(en).toContain('haushoppe.art');
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);
  expect(await page.getByTestId('lang-switch').getAttribute('href')).toContain(s.other);
});
