import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Prosa-Seiten als MDX: <name>.<lang>.mdx (z. B. home.de.mdx, kontakt.en.mdx).
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
    portrait: z.object({ src: z.string(), alt: z.string(), caption: z.string() }).optional(),
    sectionHeading: z.string().optional(),
    // Kontakt
    map: z.string().optional(),
  }),
});

export const collections = { pages };
