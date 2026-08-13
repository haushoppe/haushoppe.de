import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

// Ordinal-Detailseiten: schwarze Bühne, On-Chain-iframe, Buy-Link, dunkles Theme, kein Preis/Anfrage.

test('Ordinal-Detail: Bühne, Eyebrow, iframe, Buy-Link, dunkles Theme', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.ordinal}/`);

  await expect(page.locator('.ordinal-content')).toBeVisible();
  await expect(page.locator('.ordinal-eyebrow')).toContainText('REVEALED');
  await expect(page.locator('.ordinal-frame iframe')).toHaveAttribute('src', /ordinals\.com|ordinalsbot/);

  const buy = page.locator('a.ordinal-buy');
  await expect(buy).toHaveAttribute('href', /gamma\.io/);
  await expect(buy).toHaveAttribute('target', '_blank');
  await expect(buy).toHaveAttribute('rel', /noopener/);

  await expect(page.locator('body')).toHaveClass(/theme-invert/);
  await expect(page.locator('.art-meta__price')).toHaveCount(0);
  await expect(page.locator('a.art-inquire')).toHaveCount(0);
});
