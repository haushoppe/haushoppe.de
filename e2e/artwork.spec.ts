import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

test('h1, Bild (avif+webp), Nummer, Prev/Next vorhanden', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.woodcut}/`);
  await expect(page.locator('h1.entry-title')).toHaveCount(1);
  const img = page.getByTestId('artwork-image');
  await expect(img.locator('source[type="image/avif"]')).toHaveCount(1);
  await expect(img.locator('source[type="image/webp"]')).toHaveCount(1);
  await expect(page.getByTestId('artwork-number')).toHaveText(/^\d{4}-\d{2}/);
  await expect(page.getByTestId('artwork-nav')).toHaveCount(2);
});

// Alle vier vergebenen laufenden Nummern (nicht nur Plovdiv).
const NUMBERS: Record<string, string> = {
  plovdiv: '2015-10',
  wintermaerchen: '2015-11',
  'portraet-1': '2016-10',
  'portraet-2': '2016-11',
};
// Nummer ist sprachneutral; geprüft über DE-Slugs (EN-Slugs weichen ab) → @de-only, läuft nur
// im de-Projekt (per grepInvert aus en herausgefiltert).
for (const [slug, num] of Object.entries(NUMBERS)) {
  test(`Vergebene Nummer als Badge: ${slug} → ${num}`, { tag: '@de-only' }, async ({ page }) => {
    await page.goto(`/portfolio/${slug}/`);
    await expect(page.getByTestId('artwork-number')).toHaveText(num);
  });
}

test('Prev/Next navigieren wirklich weiter und wieder zurück', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.woodcut}/`);
  const start = new URL(page.url()).pathname;
  const nextHref = (await page.getByTestId('artwork-nav').last().getAttribute('href'))!;
  expect(nextHref).not.toBe(start);
  const esc = (p: string) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await page.getByTestId('artwork-nav').last().click();
  await expect(page).toHaveURL(new RegExp(`${esc(nextHref)}$`));
  // Gegenrichtung führt zurück zum Ausgangswerk (zyklische Kette).
  await page.getByTestId('artwork-nav').first().click();
  await expect(page).toHaveURL(new RegExp(`${esc(start)}$`));
});

test('Lightbox: öffnet per Klick, hat Blätter-Pfeile, schließt per Esc', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.woodcut}/`);
  const lb = page.getByTestId('lightbox');
  await expect(lb).toBeHidden();
  await page.getByTestId('artwork-image').locator('img').click();
  await expect(lb).toBeVisible();
  await expect(lb.getByTestId('carousel-arrow')).toHaveCount(2);
  await page.keyboard.press('Escape');
  await expect(lb).toBeHidden();
});
