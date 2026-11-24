import { test, expect } from '@playwright/test';
import { site, langOf } from './helpers/site';

// Harte User-Regel: keine Gedankenstriche (– / —) in der Copy. Der Galeriename schreibt sich mit
// Bindestrich („HAUS HOPPE - Galerie für Bildende Kunst“). Werk-Titel und Ausstellungstitel der
// Vita sind Eigennamen und bleiben wörtlich -> Galerie, Werkseiten, Vita und Kunst erwerben (nennt
// Werktitel) werden bewusst NICHT im Fließtext geprüft.
const DASH = /[–—]/;

const META_PAGES = ['home', 'videos', 'gallery', 'acquire', 'vita', 'contact', 'camping'] as const;
const COPY_PAGES = ['home', 'contact', 'camping'] as const;

for (const key of META_PAGES) {
  test(`Meta-Description ohne Gedankenstrich: ${key}`, async ({ page }, info) => {
    await page.goto(site(info).routes[key]);
    const desc = (await page.locator('head meta[name="description"]').getAttribute('content')) || '';
    expect(desc, `Gedankenstrich in Description von ${key}: "${desc}"`).not.toMatch(DASH);
  });
}

for (const key of COPY_PAGES) {
  test(`Sichtbare Copy ohne Gedankenstrich: ${key}`, async ({ page }, info) => {
    await page.goto(site(info).routes[key]);
    const text = (await page.locator('main').innerText());
    expect(text, `Gedankenstrich im sichtbaren Text von ${key}`).not.toMatch(DASH);
  });
}

// Legal-Seiten (Impressum/Datenschutz/AGB/Widerruf) ebenfalls ohne Gedankenstrich.
const LEGAL_PAGES = [
  { de: '/impressum/', en: '/imprint/' },
  { de: '/datenschutz/', en: '/privacy/' },
  { de: '/agb/', en: '/terms/' },
  { de: '/widerruf/', en: '/right-of-withdrawal/' },
  { de: '/widerruf-erklaeren/', en: '/withdraw/' },
];
for (const pair of LEGAL_PAGES) {
  test(`Legal-Seite ohne Gedankenstrich: ${pair.de}`, async ({ page }, info) => {
    const path = pair[langOf(info)];
    await page.goto(path);
    const text = (await page.locator('main').innerText());
    expect(text, `Gedankenstrich auf ${path}`).not.toMatch(DASH);
  });
}
