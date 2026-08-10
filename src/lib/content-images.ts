import type { ImageMetadata } from 'astro';

// Inhaltsbilder (Porträts, Beispiel-Galerien …) laufen über astro:assets (AVIF/WebP +
// responsive), damit sie nicht als rohe JPGs ausgeliefert werden. Ablage:
// src/assets/content/<name>.<ext>; Auflösung per Dateiname ohne Endung.
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/content/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
});

const byName: Record<string, ImageMetadata> = {};
for (const path in files) {
  const name = path.split('/').pop()!.replace(/\.[^.]+$/, '');
  byName[name] = files[path].default;
}

export function contentImage(name: string): ImageMetadata | undefined {
  return byName[name];
}
