import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

// Videos: SR-only h1, kein Player-Titel, Facade, geteilte Karussell-Komponenten, kein Seiten-Scroll.

test('SR-only h1 „Videos", kein sichtbarer Player-Titel', async ({ page }, info) => {
  await page.goto(site(info).routes.videos);
  await expect(page.locator('h1.visually-hidden')).toHaveText('Videos');
  await expect(page.locator('.vg__player-title')).toHaveCount(0);
});

test('Facade lädt youtube-nocookie-iframe beim Klick', async ({ page }, info) => {
  await page.goto(site(info).routes.videos);
  const player = page.getByTestId('video-player');
  await player.getByRole('button').click();
  await expect(player.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed/);
});

test('Karussell nutzt geteilte Pfeile + Punkte', async ({ page }, info) => {
  await page.goto(site(info).routes.videos);
  await expect(page.getByTestId('video-carousel').getByTestId('carousel-arrow')).toHaveCount(2);
  expect(await page.getByTestId('video-dot').count()).toBeGreaterThan(0);
});

test('Thumbnail-Klick wechselt Video ohne Seiten-Scroll', async ({ page }, info) => {
  await page.goto(site(info).routes.videos);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const y0 = await page.evaluate(() => window.scrollY);
  await page.getByTestId('video-thumb').nth(1).click();
  await page.waitForTimeout(700);
  const y1 = await page.evaluate(() => window.scrollY);
  expect(Math.abs(y1 - y0), 'Video-Wechsel darf nicht scrollen').toBeLessThan(40);
  await expect(page.locator('[data-testid="video-thumb"][aria-current="true"]')).toHaveCount(1);
});
