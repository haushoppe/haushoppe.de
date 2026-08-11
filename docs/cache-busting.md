# Cache-Busting: Skripte & Styles richtig einbinden

**Kurzfassung:** Alles, was Astro **importiert**, bekommt automatisch einen Content-Hash im Dateinamen (`/_astro/name.<hash>.js|css`). Ändert sich der Inhalt, ändert sich der Name → der Browser lädt garantiert die neue Version, während unveränderte Dateien ein Jahr `immutable` gecacht bleiben. Das ist der vorgesehene Weg — **so binden wir eigene Skripte und Styles ein, nicht über `public/`.**

## Warum nicht `public/`

Dateien in `public/` werden **1:1 unter stabilem Namen** ausgeliefert: `/js/gallery.js` bleibt `/js/gallery.js`. Cachet man die lange, liefert Edge **und** Browser nach einer Änderung bis zu einem Tag die **alte** Datei aus. Genau das hat hier einen hartnäckigen Bug verursacht (neues Markup traf auf altes, gecachtes `gallery.js`); manuelles Cache-Purgen half nur kurz. Die saubere Lösung ist, die Datei gar nicht erst in `public/` zu legen, sondern zu importieren.

## So machen wir es (empfohlen)

### JavaScript

Skript nach `src/scripts/` legen und in einem Layout/einer Komponente per gebündeltem `<script>` importieren:

```astro
---
// z. B. in BaseLayout.astro
---
<script>import '../scripts/gallery.js';</script>
<script>import '../scripts/yt-facade.js';</script>
```

Astro bündelt das zu `/_astro/gallery.<hash>.js` und hängt es als `type="module"` ein — **fertig, kein `?v=`, kein Helfer, kein Purgen.**

**Wichtig bei View-Transitions (ClientRouter):** Ein gebündeltes Modul läuft **genau einmal** (beim ersten Vollladen) und danach nicht mehr — auch nicht bei jeder Client-Navigation. Code, der nach **jedem** Seitenwechsel laufen muss, registriert daher einen `astro:page-load`-Listener (der feuert beim Erststart **und** nach jedem Wechsel):

```js
function run() { /* … DOM der aktuellen Seite anfassen … */ }
document.addEventListener('astro:page-load', run); // Erststart + jeder View-Transition-Wechsel
```

Genau so machen es `src/scripts/gallery.js` (Justified-Layout + Infinite Scroll) und `src/scripts/yt-facade.js` (YouTube-Facade). Event-Delegation (`document.addEventListener('click', …)`) muss man nur **einmal** registrieren — das übernimmt der einmalige Modullauf automatisch.

### CSS / Styles

`import '../styles/app.css'` in einer Komponente/Layout, oder `<style>`/`<style is:global>` direkt in der `.astro`-Datei. Beides bündelt und hasht Astro. Ebenso Bilder über `astro:assets` (`import img from '…' `→ `/_astro/*`). Auch hier: **kein manuelles Busting nötig.**

## Fallback: eine Datei MUSS unter stabilem `public/`-Pfad liegen

Selten, z. B. wenn ein Dritt-Tool eine Datei unter festem Pfad erwartet. Dann Content-Hash als Query anhängen: `/js/thing.js?v=<hash>`. Kleiner Build-Helfer:

```ts
// src/lib/asset-version.ts
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const cache = new Map<string, string>();
export function assetVersion(publicPath: string): string {
  const key = publicPath.replace(/^\//, '');
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let v = '';
  try { v = createHash('sha1').update(readFileSync(join(process.cwd(), 'public', key))).digest('hex').slice(0, 8); } catch {}
  cache.set(key, v);
  return v;
}
```

```astro
<script is:inline src={`/js/thing.js?v=${assetVersion('/js/thing.js')}`}></script>
```

**Cloudflare-Hinweis (nur für diesen Fallback):** Funktioniert mit dem Standard-Cache-Level, weil der den Query-String als Teil des Cache-Keys nimmt. Ignoriert eine Cache-Rule den Query-String, greift `?v=` nicht — dann echte Hash-**Dateinamen** erzeugen. Für den Import-Weg oben ist das alles irrelevant.

## Merksatz

Eigenes JS/CSS/Bilder → **importieren** (automatisch gehasht). `public/` nur für Dinge, die wirklich unter festem Namen erreichbar sein müssen (`favicon.ico`, `robots.txt`, `_headers`, OG-Bilder mit fester URL). Dieses Projekt hat nach dem Umbau **kein** eigenes Skript mehr in `public/`.
