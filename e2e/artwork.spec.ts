import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

// Werk-Detailseite: h1, responsives Bild, Beschriftung, Prev/Next, vergebene Nummer, Lightbox.

test('h1, Bild (avif+webp), Meta-Beschriftung, Prev/Next', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.woodcut}/`);
  await expect(page.locator('h1.entry-title')).toHaveCount(1);

  const pic = page.locator('.art-figure picture');
  await expect(pic.locator('source[type="image/avif"]')).toHaveCount(1);
  await expect(pic.locator('source[type="image/webp"]')).toHaveCount(1);

  const meta = page.locator('.art-meta');
  await expect(meta.locator('.art-meta__title')).toContainText('Olaf Hoppe');
  await expect(meta.locator('.art-meta__num')).toHaveText(/^\d{4}-\d{2}/);

  await expect(page.locator('.art-nav__link')).toHaveCount(2);
});

test('Vergebene laufende Nummer als Badge (Plovdiv 2015-10)', async ({ page }) => {
  await page.goto('/portfolio/plovdiv/');
  await expect(page.locator('.art-meta__num')).toHaveText('2015-10');
});

test('Lightbox: öffnet per Klick, Blätter-Pfeile, schließt per Esc', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.woodcut}/`);
  const lb = page.locator('#lightbox');
  await expect(lb).toBeHidden();
  await page.locator('.art-figure img').click();
  await expect(lb).toBeVisible();
  await expect(lb.locator('.lightbox__nav--prev.carousel-arrow')).toBeVisible();
  await expect(lb.locator('.lightbox__nav--next.carousel-arrow')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(lb).toBeHidden();
});
