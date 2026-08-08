import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Prosa-Seiten als MDX: <name>-<lang>.mdx (z. B. home-de.mdx, kontakt-en.mdx).
// WICHTIG: Bindestrich, KEIN Punkt — die Glob-`id` entfernt Punkte (home.de → homede).
// Body = editierbarer Fließtext; Frontmatter = strukturierte Assets (Bilder, Video-ID, Karte).
// Strukturierte Listen (Vita, Werke) bleiben JSON; Config (Nav) bleibt site.ts.
const pages = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    // Startseite
    video: z.object({ id: z.string(), title: z.string(), ratio: z.number() }).optional(),
    h1: z.string().optional(),
    welcome: z.string().optional(),
    featured: z
      .object({
        img: z.string(),
        alt: z.string(),
        href: z.string().default(''),
        caption: z.string(),
        award: z.string().default(''),
      })
      .optional(),
    // Kunst Erwerben
    hero: z.object({ src: z.string(), alt: z.string() }).optional(),
    // Kontakt
    map: z.string().optional(),
    // Standalone-Seiten (Impressum, Datenschutz, Presse …): eigener Slug + optionale Verlinkung.
    // standalone:true → eigene Route unter /<slug>/. placement steuert Verlinkung.
    standalone: z.boolean().default(false),
    // WICHTIG: nicht „slug" nennen — das ist in Astro-Collections reserviert (überschreibt die id).
    path: z.string().optional(),
    navLabel: z.string().optional(),
    placement: z.enum(['none', 'nav', 'footer']).default('none'),
  }),
});

export const collections = { pages };
