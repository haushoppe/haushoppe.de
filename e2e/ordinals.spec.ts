import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

test('Ordinal-Detail: Bühne, iframe, Buy-Link, dunkles Theme, kein Preis/Anfrage', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.ordinal}/`);

  const stage = page.getByTestId('ordinal-stage');
  await expect(stage).toBeVisible();
  await expect(stage.locator('.ordinal-logo iframe')).toHaveAttribute('title', 'REVEALED');
  await expect(stage).toContainText('Glitch Art');
  await expect(stage.locator('.ordinal-frame iframe')).toHaveAttribute('src', /ordinals\.com|ordinalsbot/);

  const buy = page.getByTestId('ordinal-buy');
  await expect(buy).toHaveAttribute('href', /gamma\.io/);
  await expect(buy).toHaveAttribute('target', '_blank');
  await expect(buy).toHaveAttribute('rel', /noopener/);

  await expect(page.locator('body')).toHaveClass(/theme-invert/);
  await expect(page.getByTestId('artwork-price')).toHaveCount(0);
  await expect(page.getByTestId('inquire-link')).toHaveCount(0);
});
