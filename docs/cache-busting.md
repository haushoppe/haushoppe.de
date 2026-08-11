# Cache-Busting für stabil benannte `public/`-Assets

**Ziel:** lange Cache-Zeiten (Performance) für eigene JS/CSS-Dateien in `public/`, **ohne** bei jeder Änderung den Cloudflare-Cache manuell purgen zu müssen.

## Das Problem

Astro hasht alles, was **importiert** wird, automatisch: `import '../styles/global.css'` oder ein gebündeltes `<script>` landen als `/_astro/global.a1b2c3.css` mit eindeutigem Content-Hash im Dateinamen. Ändert sich der Inhalt, ändert sich der Name — der Browser lädt garantiert die neue Version. Deshalb dürfen diese Dateien via `_headers` `immutable` ein Jahr gecacht werden.

Dateien in `public/` werden **1:1 unter stabilem Namen** ausgeliefert: `/js/gallery.js` bleibt `/js/gallery.js`. Cachet man die lange (`Cache-Control: public, max-age=86400`), liefert Edge **und** Browser nach einer Änderung bis zu einem Tag die **alte** Datei aus. Genau das führte hier zu einem hartnäckigen Bug: das neue Markup traf auf ein altes, gecachtes `gallery.js`. Purgen half nur kurz.

## Die Lösung: Content-Hash als `?v=…`

Wir hängen an die URL einen kurzen Hash des Datei-Inhalts an: `/js/gallery.js?v=9e41a5b2`. Ändert sich der Inhalt, ändert sich der Hash → neue URL → Cache-Miss → frische Datei. Bleibt der Inhalt gleich, bleibt die URL gleich → voller Cache-Treffer. Beste aus beiden Welten, **kein Purgen mehr nötig**.

Das gilt nur für `public/`-Dateien, die man per **literalem Pfad** referenziert (`<script src="/js/…">`, `<link href="/css/…">`). Alles, was Astro importiert/bündelt, braucht das **nicht** — das ist schon gehasht.

## Rezept (aus `haushoppe.de` übernehmbar)

### 1. Helfer `src/lib/asset-version.ts`

```ts
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

// Cache-Busting für stabil benannte public/-Dateien (z. B. /js/gallery.js): hängt einen kurzen
// Content-Hash als ?v=… an. Läuft nur beim Build (Node) und hasht jede Datei genau einmal.
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
```

### 2. Im Layout verwenden

```astro
---
import { assetVersion } from '../lib/asset-version';
---
<!-- eigenes JS aus public/ -->
<script is:inline src={`/js/gallery.js?v=${assetVersion('/js/gallery.js')}`}></script>

<!-- falls es eigenes CSS in public/ gibt (bei haushoppe.de nicht der Fall — CSS läuft über Astro) -->
<link rel="stylesheet" href={`/css/app.css?v=${assetVersion('/css/app.css')}`} />
```

### 3. `public/_headers`: lange Cache-Zeit ist jetzt sicher

```
/js/*
  Cache-Control: public, max-age=31536000, immutable

/css/*
  Cache-Control: public, max-age=31536000, immutable
```

`immutable` ist erst durch die `?v=…`-Versionierung unbedenklich: dieselbe URL bezeichnet immer denselben Inhalt.

## Wichtig bei Cloudflare

Funktioniert mit dem Standard-Cache-Level, weil der die **Query-String** als Teil des Cache-Keys nimmt (`…?v=abc` ≠ `…?v=def`). Nur falls im Zonen-Setup eine **Cache-Rule den Query-String ignoriert**, greift der Buster nicht — dann stattdessen echte Hash-**Dateinamen** erzeugen (Build-Step, der `gallery.js` → `gallery.<hash>.js` kopiert). Für unser Setup reicht `?v=…`.

## Was NICHT hierüber laufen muss

- Astro-importierte Styles/Skripte (`import '…css'`, gebündelte `<script>`): schon per Dateiname gehasht.
- Bilder aus `astro:assets` (`/_astro/*`): schon gehasht.
- Nur **stabil benannte `public/`-Assets, die per festem Pfad eingebunden werden**, brauchen `assetVersion()`.
