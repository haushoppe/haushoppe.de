import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// Sprache = Domain (kein /en/-Pfad). Zwei Builds aus einer Quelle, gesteuert über SITE_LANG:
//   SITE_LANG=de  → haushoppe.de  → dist-de
//   SITE_LANG=en  → haushoppe.art → dist-art
const LANG = process.env.SITE_LANG === 'en' ? 'en' : 'de';

export default defineConfig({
  site: LANG === 'en' ? 'https://haushoppe.art' : 'https://haushoppe.de',
  outDir: LANG === 'en' ? './dist-art' : './dist-de',
  integrations: [mdx(), sitemap()],
  image: {
    // Kunstwerke werden vorab als webp erzeugt (scripts/gen-images.mjs) und statisch
    // ausgeliefert; astro:assets bleibt für spätere Feinbild-Optimierung verfügbar.
    responsiveStyles: true,
  },
  vite: {
    // SITE_LANG zur Build-Zeit literal in den App-Code injizieren (import.meta.env.SITE_LANG).
    define: { 'import.meta.env.SITE_LANG': JSON.stringify(LANG) },
  },
});
