import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

// Harte User-Regel: keine Gedankenstriche (– / —) in der Copy. Ausnahme: der seitenweite
// Marken-Name. Werk-Titel (Olafs Nummerierung „1990/02 – H"), CV-Datumsspannen und Währung
// („500,– €") sind Daten/Konvention -> die betreffenden Fließtexte werden bewusst NICHT geprüft.
const BRAND = /HAUS HOPPE [–—] (Galerie für Bildende Kunst|Gallery for Fine Art)/gi;
const DASH = /[–—]/;

const META_PAGES = ['home', 'videos', 'gallery', 'acquire', 'vita', 'contact', 'camping'] as const;
const COPY_PAGES = ['home', 'contact', 'camping'] as const;

for (const key of META_PAGES) {
  test(`Meta-Description ohne Gedankenstrich: ${key}`, async ({ page }, info) => {
    await page.goto(site(info).routes[key]);
    const desc = (await page.locator('head meta[name="description"]').getAttribute('content')) || '';
    expect(desc.replace(BRAND, ''), `Gedankenstrich in Description von ${key}: "${desc}"`).not.toMatch(DASH);
  });
}

for (const key of COPY_PAGES) {
  test(`Sichtbare Copy ohne Gedankenstrich: ${key}`, async ({ page }, info) => {
    await page.goto(site(info).routes[key]);
    const text = (await page.locator('main').innerText()).replace(BRAND, '');
    expect(text, `Gedankenstrich im sichtbaren Text von ${key}`).not.toMatch(DASH);
  });
}
