import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

// Accessibility-Basics: genau ein h1, alt-Attribute, aussagekräftiger alt auf Inhaltsbildern,
// und reduced-motion wird respektiert.
const PAGES = ['home', 'videos', 'gallery', 'acquire', 'vita', 'camping', 'contact'] as const;

for (const key of PAGES) {
  test(`Genau ein h1: ${key}`, async ({ page }, info) => {
    await page.goto(site(info).routes[key]);
    expect(await page.locator('h1').count(), `h1-Anzahl auf ${key}`).toBe(1);
  });
}

test('Galerie-Bilder haben ein alt-Attribut', async ({ page }, info) => {
  await page.goto(site(info).routes.gallery);
  expect(await page.locator('img:not([alt])').count(), 'Bilder ohne alt').toBe(0);
});

test('Werk-Detail-Bild hat einen aussagekräftigen (nicht leeren) alt-Text', async ({ page }, info) => {
  await page.goto(`/portfolio/${site(info).work.woodcut}/`);
  const alt = (await page.getByTestId('artwork-image').locator('img').getAttribute('alt')) || '';
  expect(alt.trim().length, 'alt darf auf Inhaltsbild nicht leer sein').toBeGreaterThan(0);
});

test('prefers-reduced-motion: Slideshow-Autoplay ist aus', async ({ browser, baseURL }, info) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', baseURL });
  const p = await ctx.newPage();
  await p.goto(site(info).camper.path);
  const dots = p.getByTestId('slideshow-dot');
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
  await p.waitForTimeout(6000);
  await expect(dots.nth(0), 'ohne Motion darf nicht automatisch weitergeschaltet werden').toHaveAttribute('aria-current', 'true');
  await ctx.close();
});
