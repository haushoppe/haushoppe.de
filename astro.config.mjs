import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// haushoppe.de (DE) + haushoppe.art (EN). Zunächst DE als Root, EN unter /en; die
// endgültige Domain-pro-Sprache-Aufteilung [D1] entscheiden wir beim Deploy.
export default defineConfig({
  site: 'https://haushoppe.de',
  integrations: [sitemap()],
  image: {
    // Kunstwerke werden vorab als webp erzeugt (scripts/gen-images.mjs) und statisch
    // ausgeliefert; astro:assets bleibt für spätere Feinbild-Optimierung verfügbar.
    responsiveStyles: true,
  },
});
