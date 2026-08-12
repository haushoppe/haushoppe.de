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
    welcome: z.object({ greeting: z.string(), name: z.string() }).optional(),
    signature: z.object({ image: z.string(), alt: z.string() }).optional(),
    featured: z
      .object({
        image: z.string(),
        alt: z.string(),
        href: z.string().default(''),
        caption: z.string(),
        award: z.string().default(''),
      })
      .optional(),
    // Kunst Erwerben
    hero: z
      .object({
        name: z.string(),
        alt: z.string(),
        lead: z.string().optional(),
        ctaText: z.string().optional(),
        ctaHref: z.string().optional(),
      })
      .optional(),
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

// Optionale Zusatz-Inhalte pro Werk: Beschreibung als Markdown, Video-Embeds via <YouTube>. Die
// Struktur bleibt im JSON (Galerie/Sortierung/Bilder); nur die PROSA lebt hier als Content — der
// idiomatische Astro-Weg. id = Werk-Slug (sprachspezifisch, wie die Detail-URL). Die Detailseite
// rendert den Body unter Bild/Meta, wenn ein Eintrag mit passendem Slug existiert.
const artworkExtra = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/artwork-extra' }),
  schema: z.object({ title: z.string().optional() }),
});

export const collections = { pages, artworkExtra };
