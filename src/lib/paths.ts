import langAlt from '../data/lang-alt.json';

// Pfad-Helfer, einheitlich für Header + BaseLayout (früher dupliziert).
const ALT = langAlt as Record<string, string>;

// Pfad mit Trailing-Slash normalisieren (außer Root).
export const normPath = (p: string): string => (p !== '/' && !p.endsWith('/') ? p + '/' : p);

// Pendant-Pfad (root-relativ) aus lang-alt.json — oder undefined, wenn kein Paar existiert.
export const altOf = (p: string): string | undefined => ALT[normPath(p)];
