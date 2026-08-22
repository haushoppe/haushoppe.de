import { test, expect } from '@playwright/test';
import { site, langOf } from './helpers/site';
import { readFileSync } from 'node:fs';

// Erwartete Slide-Zahlen je Slideshow direkt aus dem Camping-MDX ableiten (nicht hart kodieren),
// damit Inhaltsänderungen den Test nicht brechen. Zusätzlich prüft der Test, dass es > 1 ist.
function slideCounts(lang: 'de' | 'en'): number[] {
  const mdx = readFileSync(new URL(`../src/content/pages/camping-${lang}.mdx`, import.meta.url), 'utf8');
  const counts: number[] = [];
  const re = /slides=\{\[([\s\S]*?)\]\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(mdx))) counts.push((m[1].match(/\bsrc:/g) || []).length);
  return counts;
}

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

  const counts = slideCounts(langOf(info));
  expect(counts[0]).toBeGreaterThan(1);
  const ss = page.getByTestId('slideshow').first();
  await expect(ss).toBeVisible();
  await expect(ss.getByTestId('slideshow-dot')).toHaveCount(counts[0]);
  await expect(ss.getByTestId('slideshow-caption').first()).toContainText(t.firstCaption);
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
  const ss = page.getByTestId('slideshow').first();
  const dots = ss.getByTestId('slideshow-dot');
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
  await ss.getByTestId('carousel-arrow').last().click(); // next
  await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true');
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'false');
});

test('Slideshow startet von allein (interval-basiert)', async ({ page }, info) => {
  await page.goto(site(info).camper.path);
  const ss = page.getByTestId('slideshow').first();
  const interval = Number(await ss.getAttribute('data-interval')) || 4500;
  const dots = ss.getByTestId('slideshow-dot');
  await expect(dots.nth(0)).toHaveAttribute('aria-current', 'true');
  await expect(dots.nth(1)).toHaveAttribute('aria-current', 'true', { timeout: interval + 3000 });
});

test('Hofladen-Abschnitt mit eigener Slideshow', async ({ page }, info) => {
  await page.goto(site(info).camper.path);
  const heading = langOf(info) === 'en' ? 'The farm shop' : 'Der Hofladen';
  await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  const shop = page.getByTestId('slideshow').nth(1);
  await expect(shop).toBeVisible();
  const counts = slideCounts(langOf(info));
  expect(counts[1]).toBeGreaterThan(1);
  await expect(shop.getByTestId('slideshow-dot')).toHaveCount(counts[1]);
});

test('Keine Gedankenstriche im Camper-Inhalt', async ({ page }, info) => {
  await page.goto(site(info).camper.path);
  expect(await page.locator('main').innerText()).not.toMatch(/[–—]/);
});
