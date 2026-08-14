import { test, expect } from '@playwright/test';
import { langOf } from './helpers/site';

// Widerrufsbutton nach § 356a BGB: hervorgehobener Footer-Button + zweistufiges Formular.
// Der finale POST /api/widerruf läuft nur produktiv (Cloudflare Function); hier wird die
// clientseitige Zwei-Stufen-Logik geprüft (Stufe 1 löst den Widerruf NICHT aus).
const PAGE: Record<'de' | 'en', string> = { de: '/widerruf-erklaeren/', en: '/withdraw/' };

test('Footer: hervorgehobener „Vertrag widerrufen"-Button verlinkt die Widerrufsfunktion', async ({ page }, info) => {
  const lang = langOf(info);
  await page.goto('/');
  const btn = page.getByTestId('withdraw-button');
  await expect(btn).toBeVisible();
  await expect(btn).toHaveText(lang === 'en' ? 'Withdraw from contract' : 'Vertrag widerrufen');
  await expect(btn).toHaveAttribute('href', PAGE[lang]);
});

test('Widerrufsformular: Zwei-Stufen-Ablauf (Eingabe → Bestätigung)', async ({ page }, info) => {
  const lang = langOf(info);
  await page.goto(PAGE[lang]);
  const step1 = page.getByTestId('widerruf-step1');
  const step2 = page.getByTestId('widerruf-step2');
  await expect(step1).toBeVisible();
  await expect(step2).toBeHidden();

  await step1.locator('[name="name"]').fill('Max Mustermann');
  await step1.locator('[name="orderId"]').fill('1YN80048');
  await step1.locator('[name="email"]').fill('kunde@example.com');
  await page.getByTestId('widerruf-next').click();

  // Erst nach „Weiter" erscheint Stufe 2; Stufe 1 ist weg (kein Sofort-Widerruf beim ersten Klick).
  await expect(step2).toBeVisible();
  await expect(step1).toBeHidden();
  await expect(step2).toContainText('Max Mustermann');
  await expect(step2).toContainText('1YN80048');
  await expect(page.getByTestId('widerruf-confirm')).toBeVisible();
});

test('Widerrufsformular: leere Pflichtfelder blockieren Stufe 2', async ({ page }, info) => {
  await page.goto(PAGE[langOf(info)]);
  await page.getByTestId('widerruf-next').click();
  await expect(page.getByTestId('widerruf-step2')).toBeHidden();
  await expect(page.getByTestId('widerruf-step1').locator('[data-wf-error]')).toBeVisible();
});
