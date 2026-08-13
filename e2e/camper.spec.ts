import { test, expect } from '@playwright/test';
import { site, langOf } from './helpers/site';

// Camper-Seite (DE + EN): PageHero, CTA-Scroll, Slideshow (Autostart/Pfeile/Punkte),
// Gut-zu-wissen-Bullets, Feuer-Hinweis, keine Gedankenstriche.
const TXT = {
  de: {
    firstCaption: 'Der Hof aus der Luft',
    rastplatz: 'Rastplatz',
    landstrom: 'Landstrom und Trinkwasser',
    grauwasser: 'Grauwasser',
    fire: 'sehr leicht entzündlich',
  },
  en: {
    firstCaption: 'The farmstead from above',
    rastplatz: 'Rest stop',
    landstrom: 'Mains electricity and drinking water',
    grauwasser: 'grey water',
    fire: 'highly flammable',
  },
};

test('Hero, Slideshow, Bullets, Feuer-Hinweis', async ({ page }, info) => {
  const lang = langOf(info);
  const s = site(info);
  const t = TXT[lang];
  await page.goto(s.camper.path);

  // PageHero: Titel + CTA (Anker, kein tel:)
  await expect(page.locator('.page-hero__title')).toContainText(s.camper.title);
  const cta = page.locator('.page-hero__cta');
  await expect(cta).toContainText(s.camper.cta);
  await expect(cta).toHaveAttribute('href', '#anrufen');

  // Slideshow: 6 Slides, Luftbild zuerst, geteilte Punkte/Pfeile
  await expect(page.locator('[data-slideshow]')).toBeVisible();
  await expect(page.locator('[data-slide]')).toHaveCount(6);
  await expect(page.locator('.slideshow__caption').first()).toContainText(t.firstCaption);
  await expect(page.locator('.slideshow__dots .carousel-dot')).toHaveCount(6);
  await expect(page.locator('.slideshow__frame .carousel-arrow')).toHaveCount(2);

  // Gut-zu-wissen: Rastplatz (fett), Landstrom/Trinkwasser, Grauwasser (letzter Bullet)
  await expect(page.locator('.page__body li strong').filter({ hasText: t.rastplatz })).toHaveCount(1);
  await expect(page.locator('.page__body li').filter({ hasText: t.landstrom })).toHaveCount(1);
  await expect(page.locator('.page__body li').last()).toContainText(t.grauwasser);

  // Feuer-Hinweis mit monochromem Icon
  const note = page.locator('.cp-note');
  await expect(note).toContainText(t.fire);
  await expect(note.locator('svg').first()).toBeVisible();
});

test('CTA scrollt zum Anrufen-Abschnitt', async ({ page }, info) => {
  const s = site(info);
  await page.goto(s.camper.path);
  await page.locator('.page-hero__cta').click();
  await expect(page.locator('#anrufen')).toBeInViewport({ timeout: 5000 });
});

test('Slideshow startet von allein (Dot 0 → 1)', async ({ page }, info) => {
  const s = site(info);
  await page.goto(s.camper.path);
  const dots = page.locator('[data-dot]');
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
  await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true', { timeout: 9000 });
});

test('Keine Gedankenstriche im Camper-Inhalt', async ({ page }, info) => {
  const s = site(info);
  await page.goto(s.camper.path);
  const text = await page.locator('main').innerText();
  expect(text, 'en-dash/em-dash im sichtbaren Text').not.toMatch(/[–—]/);
});
