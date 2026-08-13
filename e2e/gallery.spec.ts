import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

// Werke-Galerie: Filter-Zahlen (Regressions-Anker), Navigation, serverseitiges Rendern,
// und die thalassogen-Umkategorisierung (Holzschnitte -> Gemälde).

test('Filter: Gesamtzahl 333 + Kategorie-Zahlen', async ({ page }, info) => {
  const s = site(info);
  await page.goto(s.routes.gallery);
  await expect(page.locator('.gallery__filter-btn').first().locator('.gallery__filter-count')).toHaveText('333');
  for (const c of s.cats) {
    const link = page.locator(`.gallery__filter-btn[href$="${s.galleryBase}/${c.slug}/"]`);
    await expect(link, `Filter-Link ${c.slug}`).toHaveCount(1);
    await expect(link.locator('.gallery__filter-count'), `Zahl ${c.slug}`).toHaveText(String(c.count));
  }
});

test('Kategorie-Filter navigiert + markiert aktiv', async ({ page }, info) => {
  const s = site(info);
  await page.goto(s.routes.gallery);
  const cat = s.cats[0];
  await page.locator(`.gallery__filter-btn[href$="${s.galleryBase}/${cat.slug}/"]`).click();
  await expect(page).toHaveURL(new RegExp(`${s.galleryBase}/${cat.slug}/$`));
  const active = page.locator('.gallery__filter-btn.is-active');
  await expect(active).toHaveAttribute('aria-current', 'page');
  await expect(active).toContainText(cat.label);
});

test('Werke serverseitig im HTML (ohne JS sichtbar)', async ({ page }, info) => {
  const s = site(info);
  await page.goto(s.routes.gallery);
  expect(await page.locator('.gallery__item').count()).toBeGreaterThan(50);
});

test('thalassogen: in Gemälde, nicht in Holzschnitte', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`${s.galleryBase}/${s.cats[0].slug}/`); // Holzschnitte / Woodcuts
  await expect(page.locator('a[href*="/thalassogen-2000/"]')).toHaveCount(0);
  await page.goto(`${s.galleryBase}/${s.cats[1].slug}/`); // Gemälde / Paintings
  await expect(page.locator('a[href*="/thalassogen-2000/"]')).toHaveCount(1);
});
