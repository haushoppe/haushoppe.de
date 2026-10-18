import { test, expect, type Page } from '@playwright/test';
import { site } from './helpers/site';

// Seitenübergang: Das angeklickte Werk-Bild der Galerie und das große Bild der Werkseite tragen
// denselben view-transition-name (media-<pfad> mit Klasse vt-media, vergeben von
// src/scripts/view-transitions.js), der
// Browser morpht zwischen beiden, in beide Richtungen. Geprüft über die tatsächlich laufenden
// Pseudo-Animationen des Übergangs; ein doppelter Name würde den Übergang abbrechen.
async function hook(page: Page) {
  await page.evaluate(() => {
    (window as any).__vt = [];
    const orig = document.startViewTransition.bind(document);
    (document as any).startViewTransition = (arg: any) => {
      const t = orig(arg);
      t.ready
        .then(() =>
          (window as any).__vt.push(
            document
              .getAnimations()
              .filter((a: any) => a.effect?.pseudoElement)
              .map((a: any) => `${a.effect.pseudoElement} ${Math.round(a.effect.getTiming().duration)}`),
          ),
        )
        .catch((e: Error) => (window as any).__vt.push(['ABGEBROCHEN: ' + e.message]));
      return t;
    };
  });
}

test('Werk-Bild morpht von der Galerie in die Werkseite und zurück', async ({ page }, info) => {
  const s = site(info);
  await page.goto(s.routes.gallery);
  await hook(page);
  const hrefs = await page.locator('.gallery__grid .gallery__link').evaluateAll((els) => els.map((e) => e.getAttribute('href') || ''));
  // Ordinals zeigen auf der Werkseite eine Inschrift statt eines Bildes, dort gibt es kein Ziel.
  const idx = hrefs.findIndex((h) => h.startsWith('/portfolio/') && !/johannes-x-olaf/.test(h));
  const href = hrefs[idx];
  await page.locator('.gallery__grid .gallery__link').nth(idx).click();
  await page.waitForURL('**' + href);
  await expect.poll(() => page.evaluate(() => (window as any).__vt.length)).toBe(1);
  await page.goBack();
  await expect.poll(() => page.evaluate(() => (window as any).__vt.length)).toBe(2);
  const [hin, zurueck] = await page.evaluate(() => (window as any).__vt as string[][]);
  for (const run of [hin, zurueck]) {
    expect(run.some((p) => p.startsWith('ABGEBROCHEN'))).toBe(false);
    const name = 'media' + href.replace(/\/+$/, '').replace(/[^a-z0-9]+/gi, '-');
    // 520 ms = unsere Regel für *.vt-media (src/styles/view-transitions.css), nicht die
    // Browser-Standardüberblendung; so fällt auch ein fehlender CSS-Import auf.
    expect(run).toContain(`::view-transition-group(${name}) 520`);
    expect(run).toContain(`::view-transition-old(${name}) 520`);
    expect(run).toContain(`::view-transition-new(${name}) 520`);
  }
});

// Klick in die Navi mit der Maus auf dem Link: Die Kopfzeile wechselt ohne Überblendung (sonst
// liegen normaler und fetter Link übereinander), und der Hover-Unterstrich bleibt auf dem nun
// aktiven Link stehen, statt auf der neuen Seite neu anzuwachsen.
test('Navi-Klick: Kopfzeile ohne Überblendung, Unterstrich bleibt', async ({ page }, info) => {
  test.skip(!!info.project.use.isMobile, 'nur mit Maus');
  const s = site(info);
  await page.goto('/');
  await hook(page);
  const link = page.locator(`.mainnav__link[href="${s.routes.gallery}"]`);
  await link.hover();
  await link.click();
  await page.waitForURL('**' + s.routes.gallery);
  await expect.poll(() => page.evaluate(() => (window as any).__vt.length)).toBe(1);
  const [run] = await page.evaluate(() => (window as any).__vt as string[][]);
  expect(run.filter((p) => p.includes('site-header'))).toEqual([]);
  const active = page.locator('.mainnav__link.is-active');
  await expect(active).toHaveAttribute('href', s.routes.gallery);
  await expect(active).toHaveAttribute('data-hover', '');
  await page.mouse.move(5, 500);
  await expect(active).not.toHaveAttribute('data-hover', '');
});
