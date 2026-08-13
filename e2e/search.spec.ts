import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

test('Suche: Overlay öffnet (Pagefind) und schließt', async ({ page }, info) => {
  await page.goto(site(info).routes.home);
  const overlay = page.getByTestId('search-overlay');
  await expect(overlay).toBeHidden();
  await page.getByTestId('search-trigger').click();
  await expect(overlay).toBeVisible();
  await expect(page.locator('#pagefind-search')).toBeVisible();
  await page.getByTestId('search-close').click();
  await expect(overlay).toBeHidden();
});
