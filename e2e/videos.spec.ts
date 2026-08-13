import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

// Videos-Seite: SR-only h1, kein großer Player-Titel mehr, YouTube-Facade, geteilte
// Karussell-Komponenten, und die Sonderlocke „Klick wechselt Video OHNE Seiten-Scroll".

test('SR-only h1 „Videos", kein sichtbarer Player-Titel', async ({ page }, info) => {
  await page.goto(site(info).routes.videos);
  await expect(page.locator('h1.visually-hidden')).toHaveText('Videos');
  await expect(page.locator('.vg__player-title')).toHaveCount(0);
});

test('Facade lädt beim Klick das youtube-nocookie-iframe', async ({ page }, info) => {
  await page.goto(site(info).routes.videos);
  await expect(page.locator('.vg__player .yt-facade__poster')).toBeVisible();
  await page.locator('.vg__player .yt-facade__btn').click();
  await expect(page.locator('.vg__player iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed/);
});

test('Geteilte Karussell-Komponenten (CarouselArrow + carousel-dot)', async ({ page }, info) => {
  await page.goto(site(info).routes.videos);
  // Pfeile nutzen die geteilte Komponente
  await expect(page.locator('.vg__nav.carousel-arrow')).toHaveCount(2);
  // Punkte (per JS erzeugt) tragen die geteilte Klasse
  await expect(page.locator('.vg__dots .carousel-dot').first()).toHaveCount(1);
});

test('Thumbnail-Klick wechselt Video und scrollt die Seite NICHT', async ({ page }, info) => {
  await page.goto(site(info).routes.videos);
  // ganz nach unten scrollen, damit ein Seiten-Sprung überhaupt sichtbar wäre
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const y0 = await page.evaluate(() => window.scrollY);
  await page.locator('.vg__thumb').nth(1).click();
  await page.waitForTimeout(700);
  const y1 = await page.evaluate(() => window.scrollY);
  expect(Math.abs(y1 - y0), 'Video-Wechsel darf die Scroll-Position nicht verändern').toBeLessThan(40);
  // aktive Kachel markiert
  await expect(page.locator('.vg__thumb[aria-current="true"]')).toHaveCount(1);
});
