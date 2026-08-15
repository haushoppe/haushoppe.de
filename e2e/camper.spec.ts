import { test, expect } from '@playwright/test';
import { site, langOf } from './helpers/site';

const TXT = {
  de: { firstCaption: 'Der Hof aus der Luft', rastplatz: 'Rastplatz', landstrom: 'Landstrom und Trinkwasser', grauwasser: 'Grauwasser', fire: 'sehr leicht entzündlich' },
  en: { firstCaption: 'The farmstead from above', rastplatz: 'Rest stop', landstrom: 'Mains electricity and drinking water', grauwasser: 'grey water', fire: 'highly flammable' },
};

test('Hero, Slideshow, Bullets, Feuer-Hinweis', async ({ page }, info) => {
  const t = TXT[langOf(info)];
  const s = site(info);
  await page.goto(s.camper.path);

  await expect(page.getByTestId('page-hero-title')).toContainText(s.camper.title);
  const cta = page.getByTestId('page-hero-cta');
  await expect(cta).toContainText(s.camper.cta);
  await expect(cta).toHaveAttribute('href', '#anrufen');

  const ss = page.getByTestId('slideshow');
  await expect(ss).toBeVisible();
  await expect(page.getByTestId('slideshow-dot')).toHaveCount(8);
  await expect(page.getByTestId('slideshow-caption').first()).toContainText(t.firstCaption);
  await expect(ss.getByTestId('carousel-arrow')).toHaveCount(2);

  await expect(page.getByRole('listitem').filter({ hasText: t.rastplatz }).locator('strong')).toHaveText(t.rastplatz);
  await expect(page.getByRole('listitem').filter({ hasText: t.landstrom })).toHaveCount(1);
  await expect(page.getByRole('listitem').filter({ hasText: t.grauwasser })).toHaveCount(1);

  const note = page.getByTestId('fire-note');
  await expect(note).toContainText(t.fire);
  await expect(note.locator('svg')).toBeVisible();
});

test('CTA scrollt zum Anrufen-Abschnitt', async ({ page }, info) => {
  await page.goto(site(info).camper.path);
  await page.getByTestId('page-hero-cta').click();
  await expect(page.locator('#anrufen')).toBeInViewport({ timeout: 5000 });
});

test('Beide Telefonnummern als tel:-Links (Click-to-Call)', async ({ page }, info) => {
  await page.goto(site(info).camper.path);
  await expect(page.locator('a[href="tel:+493842764315"]')).toHaveCount(1);
  await expect(page.locator('a[href="tel:+4915154645012"]')).toHaveCount(1);
});

test('Slideshow: „weiter"-Pfeil schaltet deterministisch zum nächsten Motiv', async ({ page }, info) => {
  await page.goto(site(info).camper.path);
  const dots = page.getByTestId('slideshow-dot');
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
  await page.getByTestId('slideshow').getByTestId('carousel-arrow').last().click(); // next
  await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'false');
});

test('Slideshow startet von allein (interval-basiert)', async ({ page }, info) => {
  await page.goto(site(info).camper.path);
  const interval = Number(await page.getByTestId('slideshow').getAttribute('data-interval')) || 4500;
  const dots = page.getByTestId('slideshow-dot');
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
  await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true', { timeout: interval + 3000 });
});

test('Keine Gedankenstriche im Camper-Inhalt', async ({ page }, info) => {
  await page.goto(site(info).camper.path);
  expect(await page.locator('main').innerText()).not.toMatch(/[–—]/);
});
