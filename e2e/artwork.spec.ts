import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

test('h1, Bild (avif+webp), Nummer, Prev/Next', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.woodcut}/`);
  await expect(page.locator('h1.entry-title')).toHaveCount(1);

  const img = page.getByTestId('artwork-image');
  await expect(img.locator('source[type="image/avif"]')).toHaveCount(1);
  await expect(img.locator('source[type="image/webp"]')).toHaveCount(1);

  await expect(page.getByTestId('artwork-number')).toHaveText(/^\d{4}-\d{2}/);
  await expect(page.getByTestId('artwork-nav')).toHaveCount(2);
});

test('Vergebene laufende Nummer als Badge (Plovdiv 2015-10)', async ({ page }) => {
  await page.goto('/portfolio/plovdiv/');
  await expect(page.getByTestId('artwork-number')).toHaveText('2015-10');
});

test('Lightbox: öffnet per Klick, Blätter-Pfeile, schließt per Esc', async ({ page }, info) => {
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
