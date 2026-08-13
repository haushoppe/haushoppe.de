import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

test('Filter: Gesamtzahl 333 + Kategorie-Zahlen', async ({ page }, info) => {
  const s = site(info);
  await page.goto(s.routes.gallery);
  await expect(page.getByTestId('gallery-filter').first().locator('.gallery__filter-count')).toHaveText('333');
  for (const c of s.cats) {
    const link = page.locator(`[data-testid="gallery-filter"][href$="${s.galleryBase}/${c.slug}/"]`);
    await expect(link, `Filter-Link ${c.slug}`).toHaveCount(1);
    await expect(link.locator('.gallery__filter-count'), `Zahl ${c.slug}`).toHaveText(String(c.count));
  }
});

test('Kategorie-Filter navigiert + markiert aktiv', async ({ page }, info) => {
  const s = site(info);
  const cat = s.cats[0];
  await page.goto(s.routes.gallery);
  await page.locator(`[data-testid="gallery-filter"][href$="${s.galleryBase}/${cat.slug}/"]`).click();
  await expect(page).toHaveURL(new RegExp(`${s.galleryBase}/${cat.slug}/$`));
  await expect(page.locator('[data-testid="gallery-filter"][aria-current="page"]')).toContainText(cat.label);
});

test('Werke serverseitig im HTML', async ({ page }, info) => {
  await page.goto(site(info).routes.gallery);
  expect(await page.getByTestId('gallery-item').count()).toBeGreaterThan(50);
});

test('thalassogen: in Gemälde, nicht in Holzschnitte', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`${s.galleryBase}/${s.cats[0].slug}/`);
  await expect(page.locator('a[href*="/thalassogen-2000/"]')).toHaveCount(0);
  await page.goto(`${s.galleryBase}/${s.cats[1].slug}/`);
  await expect(page.locator('a[href*="/thalassogen-2000/"]')).toHaveCount(1);
});
