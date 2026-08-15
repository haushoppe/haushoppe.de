import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Prosa-Seiten als MDX: <name>-<lang>.mdx (z. B. home-de.mdx, kontakt-en.mdx).
// WICHTIG: Bindestrich, KEIN Punkt — die Glob-`id` entfernt Punkte (home.de → homede).
// Body = editierbarer Fließtext; Frontmatter = strukturierte Assets (Bilder, Video-ID, Karte).
// Werke leben jetzt in der artworks-Collection (unten); Config (Nav) bleibt site.ts.
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
        eyebrow: z.string().default(''), // kleines Label über dem Werk („Neuestes Werk")
        image: z.string(),
        alt: z.string(),
        href: z.string().default(''),
        caption: z.string(),
        intro: z.string().default(''), // Kurzbeschreibung unter der Bildunterschrift
        ctaText: z.string().default(''), // Button-Text („Weiterlesen") — Ziel ist href
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
    // Explizite Reihenfolge im Footer (kleiner = weiter vorn). Ohne Wert ans Ende. Nötig, weil
    // getCollection() sonst eine instabile Reihenfolge liefert (Footer-Links „springen" je Build).
    order: z.number().optional(),
  }),
});

// Werke: EINE Datei pro Werk, beide Sprachen im Frontmatter. Geteilte Daten (Bild, Nummer, Jahr,
// Kategorie) stehen einmal; nur Titel/Technik/Maße/Auflage haben einen de-/en-Block. Eine
// Beschreibung (wo vorhanden) lebt im Body zwischen <De>/<En>-Blöcken, die je Build die jeweils
// andere Sprache wegprunen.
const side = z.object({
  title: z.string(), // WP-Record-Titel: h1, Galerie, Seitentitel (mit Anführungszeichen)
  slug: z.string(), // sprachspezifischer Detail-Slug (/portfolio/<slug>/)
  captionTitle: z.string().default(''), // bereinigter Beschriftungs-Titel (ArtworkMeta-figcaption)
  technique: z.string().default(''),
  dimensions: z.string().default(''),
  edition: z.string().default(''),
  intro: z.string().default(''), // Teaser-Text für die Highlight-Kachel in der Galerie
});
const artworks = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/artworks' }),
  schema: ({ image }) =>
    z.object({
      artist: z.string().default('Olaf Hoppe'),
      year: z.string().default(''),
      number: z.string().default(''), // „1990-02-H" — Sortier- + Anzeige-Schlüssel
      date: z.string().optional(), // WP-Datum, nur Sortier-Fallback wenn keine Nummer
      order: z.number().default(0), // Tiebreaker bei gleicher Werk-Nummer (stabile Galerie-Reihenfolge)
      category: z.enum(['paintings', 'woodcuts', 'drawings', 'digital-art']),
      image: image().optional(), // Galerie-Bild des Werks (auch Ordinals haben ein Thumbnail)
      de: side,
      en: side,
      // Ordinals (5 Werke): On-Chain-Inschrift + Kauf-Link statt Bild.
      ordinal: z.object({ inscription: z.string(), buy: z.string().optional() }).optional(),
      // Welche Sprache eine Prosa-Beschreibung im Body hat (für den .art-extra-Wrapper).
      prose: z.object({ de: z.boolean().default(false), en: z.boolean().default(false) }).default({ de: false, en: false }),
      hidden: z.boolean().default(false),
      // Highlight: nimmt in der Galerie oben die volle Breite ein (Kachel: Bild + Intro + „Weiterlesen").
      highlight: z.boolean().default(false),
    }),
});

export const collections = { pages, artworks };
