// Zentrale Chrome-Daten für Header + Footer: Navigation, Logo, Kontakt, Social-Links.
export interface NavItem {
  href: string;
  label: string;
  badge?: string; // kleines Tag am Menüpunkt (z. B. „NEU"/„NEW")
}

export const nav: Record<'de' | 'en', NavItem[]> = {
  de: [
    { href: '/', label: 'Start' },
    { href: '/videos/', label: 'Videos' },
    { href: '/werke/', label: 'Werke' },
    { href: '/kunst-erwerben/', label: 'Kunst Erwerben' },
    { href: '/vita/', label: 'Vita' },
    { href: '/kunst-und-camping/', label: 'Camping', badge: 'NEU' },
    { href: '/kontakt/', label: 'Kontakt' },
  ],
  en: [
    { href: '/', label: 'Home' },
    { href: '/videos/', label: 'Videos' },
    { href: '/artwork/', label: 'Artwork' },
    { href: '/buy-fine-art/', label: 'Buy Fine Art' },
    { href: '/vita/', label: 'Vita' },
    { href: '/art-and-camping/', label: 'Camping', badge: 'NEW' },
    { href: '/contact/', label: 'Contact' },
  ],
};

export interface Social {
  name: string;
  href: string;
  color: string;
}
export const socials: Social[] = [
  { name: 'Instagram', href: 'https://www.instagram.com/haushoppe/', color: '#e95950' },
  { name: 'YouTube', href: 'https://www.youtube.com/channel/UCJ4sTJguVRXhnZYii4Ncl5A', color: '#ff0000' },
];

export const contact = {
  name: 'Olaf Hoppe',
  street: 'Zum Breitling 12',
  city: '23974 Boiensdorf OT Stove',
  email: 'team@haushoppe.de',
  phones: ['+49 (0) 38427 / 64315', '+49 (0) 151 54 64 50 12'],
};

export const logo = {
  // Vektor-Logo (Master unter brand/Stempel vectorized.svg). viewBox 244×41 (~5.95:1),
  // skaliert im Header auf ~48px Höhe.
  src: '/logo.svg',
  width: 285,
  height: 48,
  alt: 'HAUS HOPPE – Galerie für Bildende Kunst',
};
