import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

test('Vita: h1 + Inhalt', async ({ page }, info) => {
  await page.goto(site(info).routes.vita);
  expect(await page.locator('h1').count()).toBeGreaterThanOrEqual(1);
  await expect(page.locator('main')).toContainText(/Olaf Hoppe/i);
});
