import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

// Cache-Busting für stabil benannte public/-Dateien (z. B. /js/gallery.js): hängt einen kurzen
// Content-Hash als ?v=… an. Ändert sich der Inhalt, ändert sich die URL — so wird nie eine alte,
// zwischengespeicherte Version ausgeliefert, während unveränderte Dateien voll gecacht bleiben.
// Läuft nur beim Build (Node) und hasht jede Datei genau einmal.
const cache = new Map<string, string>();

export function assetVersion(publicPath: string): string {
  const key = publicPath.replace(/^\//, '');
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let v = '';
  try {
    const buf = readFileSync(join(process.cwd(), 'public', key));
    v = createHash('sha1').update(buf).digest('hex').slice(0, 8);
  } catch {
    /* fehlt die Datei, bleibt v leer -> URL ohne ?v= */
  }
  cache.set(key, v);
  return v;
}
