import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { readFileSync } from 'node:fs';

// Sprache = Domain (kein /en/-Pfad). Zwei Builds aus einer Quelle, gesteuert über SITE_LANG:
//   SITE_LANG=de  → haushoppe.de  → dist-de
//   SITE_LANG=en  → haushoppe.art → dist-art
const LANG = process.env.SITE_LANG === 'en' ? 'en' : 'de';

// "Versteckte" Werke (hidden:true in artworks.json) sind nur per Direkt-URL erreichbar —
// hier aus der sitemap.xml ausschliessen (die Galerie/Suche/robots-Ausschluss steckt im Code).
const hiddenPaths = new Set(
  JSON.parse(readFileSync(new URL('./src/data/artworks.json', import.meta.url), 'utf8'))
    .filter((a) => a.hidden)
    .map((a) => `/portfolio/${a.slug}/`),
);

export default defineConfig({
  site: LANG === 'en' ? 'https://haushoppe.art' : 'https://haushoppe.de',
  outDir: LANG === 'en' ? './dist-art' : './dist-de',
  integrations: [mdx(), sitemap({ filter: (page) => !hiddenPaths.has(new URL(page).pathname) })],
  image: {
    // Werke liegen als Master unter src/artwork-originals/ (Nachlass) und werden beim Build
    // über astro:assets zu AVIF+WebP in mehreren Größen optimiert (<Picture> in der Galerie
    // + Detailseite). Nichts Abgeleitetes wird versioniert. Setup wie bei haushoppe-its.de:
    // ein Default-`layout` erzeugt width-basierte srcsets, `responsiveStyles` die Skalier-CSS.
    layout: 'constrained',
    responsiveStyles: true,
  },
  vite: {
    // SITE_LANG zur Build-Zeit literal in den App-Code injizieren (import.meta.env.SITE_LANG).
    define: { 'import.meta.env.SITE_LANG': JSON.stringify(LANG) },
  },
});
