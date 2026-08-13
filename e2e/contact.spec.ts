import { test, expect } from '@playwright/test';
import { site, langOf } from './helpers/site';

test('Adresse, Telefon, Öffnungszeiten', async ({ page }, info) => {
  const lang = langOf(info);
  await page.goto(site(info).routes.contact);
  const main = page.locator('main');
  await expect(main).toContainText('Boiensdorf');
  await expect(main).toContainText('Zum Breitling');
  await expect(main).toContainText(lang === 'en' ? /opening hours/i : /Öffnungszeiten/i);
  // Telefon ist auf der Kontakt-Seite obfuskiert (·········) -> nicht per Text prüfbar.
});
