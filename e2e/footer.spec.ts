import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

// Footer: Social-Links, Kontakt-Link, Künstlername. Adresse/Telefon stehen bewusst NICHT mehr
// im Footer (nur auf Kontakt + Impressum).

test('Social-Links + Kontakt-Link im Footer', async ({ page }, info) => {
  const s = site(info);
  await page.goto(s.routes.home);
  const footer = page.locator('.site-footer');
  await expect(footer.locator('a[href*="instagram.com/haushoppe"]')).toHaveCount(1);
  await expect(footer.locator('a[href*="youtube.com/channel"]')).toHaveCount(1);
  // Kontakt-Link (statt voller Adresse) + Künstlername in der Baseline.
  await expect(footer.locator(`a[href="${info.project.name.startsWith('en') ? '/contact/' : '/kontakt/'}"]`)).toHaveCount(1);
  await expect(footer).toContainText('Olaf Hoppe');
});
