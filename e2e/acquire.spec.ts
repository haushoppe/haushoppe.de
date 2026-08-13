import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

test('Kunst Erwerben: h1 + natives <details>-Akkordeon öffnet/schließt', async ({ page }, info) => {
  await page.goto(site(info).routes.acquire);
  await expect(page.locator('h1.entry-title')).toHaveCount(1);

  const item = page.locator('details').first();
  await expect(item).toHaveCount(1);
  expect(await item.evaluate((d) => (d as HTMLDetailsElement).open)).toBe(false);
  await item.locator('summary').click();
  expect(await item.evaluate((d) => (d as HTMLDetailsElement).open)).toBe(true);
});
