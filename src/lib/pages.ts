import { getCollection, render } from 'astro:content';
import { LANG } from './lang';

// Lädt die MDX-Prosa-Seite <base>-<LANG> aus der Collection „pages" und rendert sie — die eine
// Stelle für getCollection+find+throw+render, genutzt von index/vita/[slug].
export async function loadPage(base: string) {
  const pages = await getCollection('pages');
  const entry = pages.find((p) => p.id === `${base}-${LANG}`);
  if (!entry) throw new Error(`MDX-Seite ${base}-${LANG} fehlt. Vorhandene ids: ${pages.map((p) => p.id).join(', ')}`);
  const { Content } = await render(entry);
  return { entry, Content, data: entry.data };
}
