import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

// Footer: Social-Links + Kontaktangaben.

test('Social-Links + Kontakt im Footer', async ({ page }, info) => {
  await page.goto(site(info).routes.home);
  await expect(page.locator('a[href*="instagram.com/haushoppe"]')).toHaveCount(1);
  await expect(page.locator('a[href*="youtube.com/channel"]')).toHaveCount(1);
  // Kontaktangaben (Name + Ort) irgendwo im Footer-Bereich
  await expect(page.locator('body')).toContainText('Olaf Hoppe');
  await expect(page.locator('body')).toContainText('Boiensdorf');
});
