import { test, expect } from '@playwright/test';
import { site } from './helpers/site';

// PayPal-Kaufbox: wird server-seitig NUR auf Holzschnitten gerendert. Die eigentlichen Smart
// Buttons laden erst über die Cloudflare-Functions (gegen den statischen Testserver nicht
// vorhanden) — geprüft wird also die konditionale Server-Ausgabe + Graceful Degradation: der
// E-Mail-CTA bleibt in jedem Fall als Kaufweg erhalten.

test('Holzschnitt: Kaufbox (785 EUR) + Buttons-Mount + E-Mail-CTA', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.woodcut}/`);
  const buy = page.getByTestId('paypal-buy');
  await expect(buy).toBeVisible();
  await expect(buy).toContainText('785 EUR');
  await expect(page.getByTestId('paypal-buttons')).toHaveCount(1);
  await expect(page.getByTestId('inquire-link')).toHaveCount(1);
});

test('Kein Holzschnitt (Aquarell 1167): keine Kaufbox, aber E-Mail-CTA', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.untitled}/`);
  await expect(page.getByTestId('paypal-buy')).toHaveCount(0);
  await expect(page.getByTestId('inquire-link')).toHaveCount(1);
});
