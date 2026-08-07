// Sprache = Domain. Ein Astro-Projekt, zwei Builds:
//   SITE_LANG=de  → haushoppe.de  (Deutsch am Root)
//   SITE_LANG=en  → haushoppe.art (Englisch am Root)
// SITE_LANG wird in astro.config via vite.define gesetzt (aus process.env.SITE_LANG).
export const LANG: 'de' | 'en' = (import.meta.env.SITE_LANG === 'en' ? 'en' : 'de');

export const DE_ORIGIN = 'https://haushoppe.de';
export const EN_ORIGIN = 'https://haushoppe.art';

export const SELF_ORIGIN = LANG === 'en' ? EN_ORIGIN : DE_ORIGIN;
export const OTHER_ORIGIN = LANG === 'en' ? DE_ORIGIN : EN_ORIGIN;
