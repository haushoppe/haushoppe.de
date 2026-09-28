import { test, expect } from '@playwright/test';
import { site, langOf } from './helpers/site';

// PayPal-Kaufbox: wird server-seitig NUR auf Holzschnitten gerendert. Die eigentlichen Smart
// Buttons laden erst über die Cloudflare-Functions (gegen den statischen Testserver nicht
// vorhanden) — geprüft wird also die konditionale Server-Ausgabe + Graceful Degradation: der
// E-Mail-CTA bleibt in jedem Fall als Kaufweg erhalten.

test('Holzschnitt: Kaufbox (785 € / 1.000 € gerahmt) + Buttons-Mount + E-Mail-CTA', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.woodcut}/`);
  const buy = page.getByTestId('paypal-buy');
  await expect(buy).toBeVisible();
  await expect(buy).toContainText('785 €');
  await expect(buy).toContainText(langOf(info) === 'en' ? '1,000 €' : '1.000 €');
  await expect(buy).toContainText(
    langOf(info) === 'en' ? 'Germany, Austria and Switzerland' : 'Deutschland, Österreich und der Schweiz',
  );
  await expect(buy).toContainText(langOf(info) === 'en' ? 'delivery within 7 days' : 'Lieferung innerhalb von 7 Tagen');
  await expect(page.getByTestId('paypal-buttons')).toHaveCount(1);
  await expect(page.getByTestId('inquire-link')).toHaveCount(1);
});

// EU-Mitteilung zur gesetzlichen Gewährleistung (DVO (EU) 2025/1960): in der Kaufbox VOR den
// Buttons, in der Sprache der Seite, die Grafik wirklich geladen (nicht nur ein leerer Rahmen)
// und das QR-Ziel zusätzlich als Link.
test('Holzschnitt: EU-Gewährleistungs-Mitteilung vor den Buttons', async ({ page }, info) => {
  const s = site(info);
  const en = langOf(info) === 'en';
  await page.goto(`/portfolio/${s.work.woodcut}/`);
  const notice = page.getByTestId('paypal-buy').getByTestId('guarantee-notice');
  await notice.scrollIntoViewIfNeeded();
  const img = notice.locator('img');
  await expect(img).toHaveAttribute('src', en ? '/eu-guarantee-en.svg' : '/eu-gewaehrleistung-de.svg');
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await expect(notice.locator('a')).toHaveAttribute(
    'href',
    en ? 'https://europa.eu/youreurope/guarantees' : 'https://europa.eu/youreurope/garantien',
  );
  const noticeBox = await notice.boundingBox();
  const buttonsBox = await page.getByTestId('paypal-buttons').boundingBox();
  expect(noticeBox!.y).toBeLessThan(buttonsBox!.y);
});

test('Gewährleistungsseite im Footer verlinkt und mit Mitteilung', async ({ page }, info) => {
  const en = langOf(info) === 'en';
  const path = en ? '/legal-guarantee/' : '/gewaehrleistung/';
  await page.goto('/');
  await expect(page.locator(`footer a[href="${path}"]`)).toHaveCount(1);
  await page.goto(path);
  await expect(page.locator('main').getByTestId('guarantee-notice')).toHaveCount(1);
});

// Button-Lösung (§ 312j Abs. 3, 4 BGB): Das PayPal-SDK wird durch eine Attrappe ersetzt, die beim
// Klick createOrder + onApprove aufruft wie das echte SDK. Geprüft wird: SDK mit commit=false,
// vor der Freigabe kein Bestellbutton, die Freigabe bucht NICHT ab, erst der eigene Button
// „Zahlungspflichtig bestellen" ruft capture-order auf.
const FAKE_SDK = `window.paypal = { Buttons: function (opts) { return { render: function (el) {
  var b = document.createElement('button'); b.type = 'button'; b.textContent = 'PayPal';
  b.setAttribute('data-testid', 'fake-paypal');
  b.onclick = function () { Promise.resolve(opts.createOrder()).then(function (id) { return opts.onApprove({ orderID: id }, {}); }); };
  el.appendChild(b); } }; } };`;

test('Button-Lösung: PayPal gibt nur frei, erst „Zahlungspflichtig bestellen" bucht ab', async ({ page }, info) => {
  const s = site(info);
  const en = langOf(info) === 'en';
  let sdkUrl = '';
  let captures = 0;
  await page.route('**/api/paypal/config', (r) =>
    r.fulfill({ json: { enabled: true, clientId: 'test-client', currency: 'EUR', env: 'sandbox' } }),
  );
  await page.route('https://www.paypal.com/sdk/js**', (r) => {
    sdkUrl = r.request().url();
    return r.fulfill({ contentType: 'application/javascript', body: FAKE_SDK });
  });
  await page.route('**/api/paypal/create-order', (r) => r.fulfill({ json: { id: 'TESTORDER1' } }));
  await page.route('**/api/paypal/capture-order', (r) => {
    captures++;
    return r.fulfill({ json: { id: 'TESTORDER1', status: 'COMPLETED' } });
  });

  await page.goto(`/portfolio/${s.work.woodcut}/`);
  const buy = page.getByTestId('paypal-buy');
  await buy.scrollIntoViewIfNeeded();
  const fake = page.getByTestId('fake-paypal');
  await expect(fake).toBeVisible();
  expect(sdkUrl).toContain('commit=false');

  const order = page.getByTestId('paypal-order');
  await expect(order).toBeHidden();
  await expect(order).toHaveText(en ? 'Order with obligation to pay' : 'Zahlungspflichtig bestellen');

  await fake.click();
  await expect(order).toBeVisible();
  await expect(page.getByTestId('paypal-summary')).toContainText('785 €');
  await expect(buy.locator('.wc-buy__variant-input').first()).toBeDisabled();
  expect(captures).toBe(0);

  await order.click();
  await expect(page.getByTestId('paypal-status')).toBeVisible();
  expect(captures).toBe(1);
});

test('Kein Holzschnitt (Aquarell 1167): keine Kaufbox, aber E-Mail-CTA', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.aquarell}/`);
  await expect(page.getByTestId('paypal-buy')).toHaveCount(0);
  await expect(page.getByTestId('inquire-link')).toHaveCount(1);
});
