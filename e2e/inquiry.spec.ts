import { test, expect } from '@playwright/test';
import { site, langOf } from './helpers/site';

// URLSearchParams.get() dekodiert bereits — NICHT zusätzlich decodeURIComponent (scheitert an „7 % MwSt").
function mailto(href: string) {
  const u = new URL(href);
  return { to: u.pathname, subject: u.searchParams.get('subject') || '', body: u.searchParams.get('body') || '' };
}

test('Holzschnitt-Anfrage: Empfänger, Betreff, Werk-Link + Preis in der Mail', async ({ page }, info) => {
  const lang = langOf(info);
  const s = site(info);
  await page.goto(`/portfolio/${s.work.woodcut}/`);
  const a = page.getByTestId('inquire-link');
  await expect(a).toBeVisible();
  await expect(a).toHaveText(lang === 'en' ? 'Enquire' : 'Interesse anfragen');
  const m = mailto((await a.getAttribute('href'))!);
  expect(m.to).toBe('team@haushoppe.de');
  expect(m.subject).toContain(lang === 'en' ? 'Interest in' : 'Interesse an');
  expect(m.body).toContain(`${s.origin}/portfolio/${s.work.woodcut}/`);
  expect(m.body, 'Preis in Holzschnitt-Mail').toContain('785 €');
});

test('Titelloses Werk: Fallback „Werk <Nr>" statt leerer Anführungszeichen', async ({ page }, info) => {
  const lang = langOf(info);
  const s = site(info);
  await page.goto(`/portfolio/${s.work.untitled}/`);
  const m = mailto((await page.getByTestId('inquire-link').getAttribute('href'))!);
  expect(m.subject).toContain(lang === 'en' ? 'artwork 2016-07-AQ' : 'Werk 2016-07-AQ');
  expect(m.subject).not.toContain('""');
  expect(m.subject).not.toContain('„“');
});

test('Ordinal: kein Interesse-Button', async ({ page }, info) => {
  await page.goto(`/portfolio/${site(info).work.ordinal}/`);
  await expect(page.getByTestId('inquire-link')).toHaveCount(0);
});
