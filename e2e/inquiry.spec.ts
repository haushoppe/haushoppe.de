import { test, expect } from '@playwright/test';
import { site, langOf } from './helpers/site';

// „Interesse anfragen"-mailto pro Werk: Empfänger, Betreff, Body (mit Werk-Link + ggf. Preis),
// titelloser Fallback, nicht auf Ordinals.

function mailto(href: string) {
  // URLSearchParams.get() dekodiert bereits — NICHT zusätzlich decodeURIComponent (scheitert an „7 % MwSt").
  const u = new URL(href);
  return {
    to: u.pathname,
    subject: u.searchParams.get('subject') || '',
    body: u.searchParams.get('body') || '',
  };
}

test('Holzschnitt-Anfrage: Empfänger, Betreff, Werk-Link + Preis in der Mail', async ({ page }, info) => {
  const lang = langOf(info);
  const s = site(info);
  await page.goto(`/portfolio/${s.work.woodcut}/`);
  const a = page.locator('a.art-inquire');
  await expect(a).toBeVisible();
  await expect(a).toHaveText(lang === 'en' ? 'Enquire' : 'Interesse anfragen');
  const href = await a.getAttribute('href');
  expect(href).toContain('mailto:team@haushoppe.de');
  const m = mailto(href!);
  expect(m.to).toBe('team@haushoppe.de');
  expect(m.subject).toContain(lang === 'en' ? 'Interest in' : 'Interesse an');
  expect(m.body).toContain(`${s.origin}/portfolio/${s.work.woodcut}/`);
  expect(m.body, 'Preis in Holzschnitt-Mail').toContain('785 EUR');
});

test('Titelloses Werk: Fallback „Werk <Nr>" statt leerer Anführungszeichen', async ({ page }, info) => {
  const lang = langOf(info);
  const s = site(info);
  await page.goto(`/portfolio/${s.work.untitled}/`);
  const href = await page.locator('a.art-inquire').getAttribute('href');
  const m = mailto(href!);
  expect(m.subject).toContain(lang === 'en' ? 'artwork 2016-07-AQ' : 'Werk 2016-07-AQ');
  expect(m.subject).not.toContain('""');
  expect(m.subject).not.toContain('„“');
});

test('Ordinal: kein Interesse-Button', async ({ page }, info) => {
  const s = site(info);
  await page.goto(`/portfolio/${s.work.ordinal}/`);
  await expect(page.locator('a.art-inquire')).toHaveCount(0);
});
