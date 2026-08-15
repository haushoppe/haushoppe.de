import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, readdirSync } from 'node:fs';
import yaml from 'js-yaml';

// Sprache = Domain (kein /en/-Pfad). Zwei Builds aus einer Quelle, gesteuert über SITE_LANG:
//   SITE_LANG=de  → haushoppe.de  → dist-de
//   SITE_LANG=en  → haushoppe.art → dist-art
const LANG = process.env.SITE_LANG === 'en' ? 'en' : 'de';

// "Versteckte" Werke (hidden:true im Werk-Frontmatter) sind nur per Direkt-URL erreichbar und
// via noindex nicht indexiert — hier auch aus der sitemap.xml ausschließen. Quelle ist dieselbe
// Collection, die die Seiten erzeugt (Pfad = der sprachspezifische Slug dieser Build-Sprache).
const artDir = new URL('./src/content/artworks/', import.meta.url);
const hiddenPaths = new Set();
for (const f of readdirSync(artDir)) {
  if (!/\.(md|mdx)$/.test(f)) continue;
  const src = readFileSync(new URL(f, artDir), 'utf8');
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) continue;
  let d;
  try {
    d = yaml.load(m[1]);
  } catch {
    continue;
  }
  if (d?.hidden && d[LANG]?.slug) hiddenPaths.add(`/portfolio/${d[LANG].slug}/`);
}

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
    plugins: [tailwindcss()],
    // SITE_LANG zur Build-Zeit literal in den App-Code injizieren (import.meta.env.SITE_LANG).
    define: { 'import.meta.env.SITE_LANG': JSON.stringify(LANG) },
  },
});
