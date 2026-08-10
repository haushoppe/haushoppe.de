import type { ImageMetadata } from 'astro';

// Banner-/Hero-Bilder laufen über astro:assets (AVIF/WebP + responsive), damit sie nicht als
// rohe JPGs ausgeliefert werden. Ablage: src/assets/banners/<name>.<ext>; Auflösung per
// Dateiname ohne Endung (z. B. "haushoppe-stage").
const files = import.meta.glob<{ default: ImageMetadata }>('../assets/banners/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
});

const byName: Record<string, ImageMetadata> = {};
for (const path in files) {
  const name = path.split('/').pop()!.replace(/\.[^.]+$/, '');
  byName[name] = files[path].default;
}

export function bannerImage(name: string): ImageMetadata | undefined {
  return byName[name];
}
