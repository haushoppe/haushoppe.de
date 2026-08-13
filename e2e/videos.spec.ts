import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

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

test('Karussell nutzt die geteilte CarouselArrow-Komponente', async ({ page }, info) => {
  await page.goto(site(info).routes.videos);
  await expect(page.getByTestId('video-carousel').getByTestId('carousel-arrow')).toHaveCount(2);
});

test('Thumbnail-Klick wechselt Video und löst KEINEN Seiten-Scroll aus', async ({ page }, info) => {
  await page.goto(site(info).routes.videos);
  const thumb = page.getByTestId('video-thumb').nth(2);
  await thumb.scrollIntoViewIfNeeded();
  // Deterministisch: Scroll-Wächter installieren, dann klicken -> es darf KEIN scroll-Event kommen.
  await page.evaluate(() => {
    (window as unknown as { __sc: boolean }).__sc = false;
    window.addEventListener('scroll', () => ((window as unknown as { __sc: boolean }).__sc = true), { passive: true });
  });
  await thumb.click();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => (window as unknown as { __sc: boolean }).__sc), 'Video-Wechsel darf nicht scrollen').toBe(false);
  await expect(page.locator('[data-testid="video-thumb"][aria-current="true"]')).toHaveCount(1);
});
