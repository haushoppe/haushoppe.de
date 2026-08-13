import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

// Homepage: HomeHero vorhanden + sichtbar.

test('HomeHero vorhanden', async ({ page }, info) => {
  await page.goto(site(info).routes.home);
  await expect(page.locator('.ohero')).toBeVisible();
});
