// Werk-Bilder für astro:assets: die Master unter src/artwork-originals/ (Nachlass) als
// optimierbare Assets laden und je Werk-ID die passende ImageMetadata bereitstellen.
// Astro erzeugt daraus beim Build AVIF+WebP in mehreren Größen (<Picture>). DE und EN eines
// Werks teilen sich dieselbe Datei — die Zuordnung Werk-ID -> Datei kommt aus dem Manifest.
import type { ImageMetadata } from 'astro';
import manifest from '../artwork-originals/manifest.json';

// Alle Archiv-Bilder (gemischte Formate) als ImageMetadata. eager: beim Build aufgelöst.
const files = import.meta.glob<ImageMetadata>(
  '../artwork-originals/**/*.{avif,jpg,jpeg,png,gif,bmp}',
  { eager: true, import: 'default' },
);

type Entry = { datei: string; werk_ids: string[] };
const byId = new Map<string, ImageMetadata>();
for (const e of manifest as Entry[]) {
  const meta = files[`../artwork-originals/${e.datei}`];
  if (meta) for (const id of e.werk_ids) byId.set(id, meta);
}

export function artworkImage(id: string): ImageMetadata | undefined {
  return byId.get(id);
}
export function hasArtworkImage(id: string): boolean {
  return byId.has(id);
}
