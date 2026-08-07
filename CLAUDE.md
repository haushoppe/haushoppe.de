# CLAUDE.md — HAUS HOPPE (haushoppe.de / haushoppe.art)

Arbeitsanleitung & Architektur-Doku für dieses Repo. Für Claude Code **und** für Menschen,
die morgen Inhalte pflegen wollen.

---

## 1. Was ist das?

Die Website der **HAUS HOPPE – Galerie für Bildende Kunst** (Künstler **Olaf Hoppe**),
migriert von WordPress zu einer **statischen Astro-Site**.

- **Astro 5**, reines SSG (kein Server, keine DB, kein WordPress mehr).
- **Zweisprachig**: Deutsch (Domain **haushoppe.de**) + Englisch (Domain **haushoppe.art**).
  Lokal liegt DE unter `/`, EN unter `/en/`. **Die Domain bestimmt die Sprache** — die
  Domain-Aufteilung passiert erst beim Deploy (Cloudflare Pages, zwei Custom-Domains).
- **645 Kunstwerke**, Galerie mit Justified-Layout + Filter, Video-Seite, ein paar
  Content-Seiten, Volltextsuche.
- **Design = wie die alte Seite** (Astra-Theme-Look), aber sauber & schlank neu gebaut:
  kein Gutenberg-Markup mehr, kein `ast-*`-Theme-Ballast, CSS von 557 → 53 KB.

### Befehle

```bash
npm run dev       # Entwicklung (localhost:4321) — Suche funktioniert hier NICHT (siehe Suche)
npm run build     # Produktion: astro build + Pagefind-Suchindex
npm run preview    # gebaute Seite lokal ansehen (inkl. Suche) — hierfür ZUM Testen nutzen
npm run images    # Kunstwerk-Bilder neu erzeugen (scripts/gen-images.mjs)
```

> **Wichtig:** Die **Suche** (Pagefind) entsteht erst im `build`-Schritt. Zum Prüfen immer
> `npm run build && npm run preview`, nicht `npm run dev`.

---

## 2. Projektstruktur

```
src/
├── pages/                    # jede Datei = eine Route
│   ├── index.astro            # DE Startseite      → Home.astro
│   ├── werke.astro            # DE Galerie         → Gallery.astro
│   ├── videos.astro           # DE Videos          → VideosGallery.astro
│   ├── vita.astro             # DE Vita            → ContentSections + data/vita.json
│   ├── kontakt.astro          # DE Kontakt         → ContentSections + data/kontakt.json
│   ├── kunst-erwerben.astro   # DE Kunst Erwerben  → AcquireArt.astro
│   ├── portfolio/[slug].astro # 322 DE Detailseiten (ein Kunstwerk je Seite)
│   └── en/…                    # dieselben Seiten auf Englisch (artwork, buy-fine-art, contact …)
├── components/               # siehe Abschnitt 4
├── layouts/BaseLayout.astro  # HTML-Gerüst: <head>, Header, <main>, Footer, Suche
├── lib/                      # artworks.ts (Galerie-Daten), ordinals.ts
├── data/                     # Inhalts- & Konfig-Daten (siehe Abschnitt 5)
├── styles/                   # global.css (Basis) + wp-design.css (schlanke Galerie-Reste)
public/
├── media/…                   # alle Bilder (aus WP-Uploads, /media/JJJJ/MM/…)
├── artworks/<id>.webp        # web-optimierte Kunstwerk-Bilder (gitignored, per gen-images)
├── js/                       # vp-justified.js (Galerie-Layout), yt-facade.js (Video-Klick)
├── vendor/jquery.min.js       # nur für den Video-Slider
├── ayg-plugin/…              # echtes YouTube-Gallery-Plugin (nur Videos-Seite)
└── pagefind/…                # Suchindex (wird beim build erzeugt, gitignored)
scripts/                      # einmalige Migrations-/Generier-Skripte (siehe Abschnitt 8)
```

---

## 3. Das CSS-System

Bewusst klein und in **drei Ebenen**:

### a) `src/styles/global.css` — die Basis (Design-Tokens + Typo + Layout)
Alle Farben/Fonts/Abstände als CSS-Variablen, **exakt aus der Live-Seite gemessen**:

```css
--serif   Merriweather (Überschriften)      --ink    #3a3a3a (Überschriften)
--sans    System-Sans (Fließtext)           --text   #4b4f58 (Text)
--rule    #000 (Header-Linien)              --muted  #666    (Links)
--footer-bg #3a3a3a                         --container 1240px, --pad 20px
```

Hier stehen: Body-Typo, `h1`–`h3`, Links, und das **Layout-System** (siehe unten).

### b) Komponenten-CSS (scoped)
Jede `.astro`-Komponente bringt ihr eigenes `<style>` mit (Astro scoped das automatisch).
Kein globales Durcheinander. Beispiele: `.acq-*` (Kunst Erwerben), `.cp-*` (Vita/Kontakt),
`.home-*` (Startseite), `.site-header`/`.mainnav`, `.site-footer`.

### c) `src/styles/wp-design.css` — schlanker Galerie-Rest (53 KB)
Der eingedampfte Rest des alten Astra/Visual-Portfolio-CSS, **nur noch für die Galerie**
(`.vp-portfolio*`-Klassen: Kacheln, Overlay-Hover, Filter). Per PurgeCSS auf das tatsächlich
Genutzte reduziert. **Nicht von Hand editieren** — bei Bedarf neu purgen:
```bash
npx purgecss --css src/styles/wp-design.css --content 'dist/**/*.html' 'public/js/**/*.js' \
  --safelist 'vp-portfolio__ready' '/^vp-/' '/^slick/' '/^wp-block/' '/^entry/' --output …
```

### Das Layout-System (Inhaltsbreiten)
Statt der alten Astra-Body-Klassen steuert ein `layout`-Prop an `BaseLayout` die Breite:

| `layout`      | Wirkung                                   | wer nutzt es               |
|---------------|-------------------------------------------|----------------------------|
| *(keins)*     | volle Breite (Komponenten zentrieren selbst; Galerie full-bleed) | Home, Vita, Kontakt, Kunst-Erwerben, **Werke** |
| `"boxed"`     | Inhalt 1200 px zentriert                  | Videos                     |
| `"article"`   | 1200 px + weißer Kasten (`.art-single`, 48 px Innenabstand) | Werk-Detailseiten |

---

## 4. Die Komponenten

| Komponente            | Aufgabe |
|-----------------------|---------|
| `BaseLayout.astro`    | HTML-Gerüst: `<head>` (Titel/Description/Favicon), `<Header>`, `<main class="site-main …">`, `<Footer>`, `<Search>`. Props: `title`, `description`, `lang`, `layout`. |
| `Header.astro`        | Logo + Nav-Leiste (700 px, schwarze Linien) + Sprach-Flagge + Such-Icon; mobil Hamburger. Aktiver Menüpunkt & Sprach-Pendant server-seitig (aus `data/site.ts` + `data/lang-alt.json`). |
| `Footer.astro`        | Dunkler Balken: „Folge uns bei" + Social-Icons + Kontakt 2-spaltig (aus `data/site.ts`). |
| `Home.astro`          | Startseite: Hero-Video-Facade + 2 Spalten (Text/Signatur | Werk/Links). Inhalt kommt als `content`-Objekt aus `index.astro`/`en/index.astro`. |
| `Gallery.astro`       | Galerie: Kategorie-Filter + Justified-Grid (`public/js/vp-justified.js`). Items aus `lib/artworks.ts`. |
| `VideosGallery.astro` | Video-Seite: der **echte** „ayg Classic-Slider" (Original-Plugin), Block-HTML aus `data/live-videos*.json`. |
| `AcquireArt.astro`    | Kunst Erwerben: Hero + 2-Spalten + `<details>`-Akkordeon (kein JS). Inhalt aus `kunst-erwerben.astro`. |
| `ContentSections.astro`| Generischer Renderer für Textseiten (Vita, Kontakt): Überschrift + Listen/Absätze + optionale Karte. Inhalt aus `data/vita.json` / `data/kontakt.json`. |
| `ArtworkBody.astro`   | Inhalt einer Detailseite: normal das große Bild, bei den 5 Ordinals stattdessen iframe + Kauf-Link (invertiertes Design). |
| `Search.astro`        | Pagefind-Overlay, öffnet beim Klick auf das Such-Icon (`[data-search-trigger]`). |

---

## 5. Die Daten (`src/data/`)

**Aktiv genutzt:**
- `site.ts` — **Navigation, Social-Links, Kontaktadresse, Logo** (DE+EN). Zentrale Stelle fürs Chrome.
- `vita.json`, `kontakt.json` — Inhalt der Vita-/Kontakt-Seite (Abschnitte, editierbar).
- `artworks.json` — alle 645 Kunstwerke (id, slug, title, lang, trid, categories, date …).
- `artworks-media.json` — je Kunstwerk `{src,w,h}` des webp-Bildes.
- `lang-alt.json` — DE↔EN-Pendant je URL (für den Sprachumschalter). Per `scripts/gen-lang-alt.mjs`.
- `live-videos.json` / `live-videos-en.json` — der server-gerenderte Video-Slider-Block.
- `videos-playlist.json` — die 25 Video-IDs/Titel (Referenz).

**Migrations-Altlasten (nicht importiert, können ignoriert/gelöscht werden):**
`attachments.json`, `menus.json`, `pages.json`, `translations.json`.

---

## 6. ✏️ Inhalte pflegen — „morgen neue Inhalte"

### Startseite ändern (Text, Willkommen, hervorgehobenes Werk, Hero-Video)
`src/pages/index.astro` (DE) bzw. `src/pages/en/index.astro` (EN). Oben im `content`-Objekt
alles editierbar: `video.id` (YouTube-ID), `h1`, `intro` (Absätze, HTML erlaubt), `welcome`
(Signaturblock), `featured` (Werkbild + Bildunterschrift + Link). Bilder in `public/media/…`.

### Vita / Kontakt ändern
`src/data/vita.json` bzw. `kontakt.json`. Struktur = Liste von **Abschnitten**:
`{ heading, lines[] }` (Listen), `{ heading, paragraphs[] }` (Fließtext), `center:true`
(zentriert), `map` (Google-Maps-URL). Für EN das `en`-Objekt in derselben Datei.

### Kunst Erwerben ändern
`src/pages/kunst-erwerben.astro` / `en/buy-fine-art.astro`. Im `content`-Objekt: `intro`,
`portrait`, und `items[]` (die Akkordeon-Einträge: `{ title, html }`).

### Navigation, Social-Links, Kontaktadresse, Logo
**`src/data/site.ts`** — eine Datei für alles. Menüpunkte in `nav.de` / `nav.en`, Socials in
`socials`, Adresse in `contact`.

### Neues Kunstwerk hinzufügen
Das ist der einzige Bereich, der noch datengetrieben ist (kam aus dem WP-Export). Schritte:
1. **Bild** als webp nach `public/artworks/<neueID>.webp` legen (max ~1400 px; `npm run images`
   erzeugt sie sonst aus WP-Uploads).
2. Eintrag in `src/data/artworks-media.json`: `"<neueID>": { "src":"/artworks/<neueID>.webp","w":…,"h":… }`.
3. Eintrag(e) in `src/data/artworks.json` — je Sprache ein Objekt mit **gleicher `trid`**
   (verbindet DE↔EN): `id, slug, title, lang, trid, date, categories:[{taxonomy:"portfolio_category",slug,name}]`.
4. Wenn es in beiden Sprachen erscheinen soll: `npm run build` und in `scripts/gen-lang-alt.mjs`
   ist die Portfolio-Verknüpfung schon automatisch (über `trid`).

> Tipp fürs nächste Mal: Wenn viele neue Werke kommen, lohnt eine kleine
> `artworks/*.md`-Content-Collection statt der JSON — sag Bescheid, dann bauen wir das um.

### Video hinzufügen (Achtung: Sonderfall)
Die Video-Seite nutzt noch den **kopierten Slider-Block** aus `data/live-videos*.json` (echtes
Plugin-Markup). Ein Video ergänzen = ein `<div class="ayg-video …">…</div>` im JSON nachbauen.
Unkomfortabel — wenn du die Videos öfter pflegen willst, sollten wir die Video-Seite auf eine
saubere, datengetriebene Variante (Liste aus `videos-playlist.json`) umstellen.

### Neue Seite anlegen
Neue Datei unter `src/pages/` (+ `src/pages/en/`). Muster:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="… - HAUS HOPPE" description="…">
  <h1>Überschrift</h1>
  <p>Inhalt …</p>
</BaseLayout>
```
Dann in `src/data/site.ts` einen Menüpunkt ergänzen und in `scripts/gen-lang-alt.mjs` das
DE↔EN-Paar eintragen (für den Sprachumschalter), danach `node scripts/gen-lang-alt.mjs`.

---

## 7. Zweisprachigkeit (i18n)

> **⭐ Deutsch ist immer führend.** DE ist die Quell-/Leitsprache, Englisch ist die
> **1:1-Übersetzung** davon. Neue Inhalte immer zuerst auf Deutsch schreiben, dann EN
> übersetzen. EN-Seiten sollen inhaltlich der DE-Fassung entsprechen (nicht abweichen).

- **Domain = Sprache.** Lokal: DE unter `/`, EN unter `/en/`. Beim Deploy wird `/en/` zu
  haushoppe.art (Domain-Split — noch offen, siehe MIGRATION-PLAN.md [D1]).
- Der **Sprachumschalter** (Flagge im Header) zeigt aufs jeweilige Pendant. Die Zuordnung
  steht in `src/data/lang-alt.json` (Seiten fest, Portfolio automatisch über `trid`).
- Verknüpfte DE/EN-Kunstwerke haben dieselbe **`trid`** in `artworks.json`.

## 8. Suche (Pagefind)

Clientseitige Volltextsuche. Der Index entsteht beim `build` (`pagefind --site dist`) und liegt
unter `public`→`dist/pagefind/`. `data-pagefind-body` steckt auf `<main>`; Galerie-Grids sind
per `data-pagefind-ignore` ausgenommen (Detailseiten sind die Suchziele). DE/EN werden über
`<html lang>` automatisch getrennt. **Nur im `preview`/Prod sichtbar, nicht im `dev`.**

## 9. Migrations-Skripte (`scripts/`)

Einmalig gelaufen, für Referenz/Regenerierung:
- `gen-images.mjs` — WP-Uploads → `public/artworks/<id>.webp` + `artworks-media.json`.
- `gen-lang-alt.mjs` — erzeugt `data/lang-alt.json` (Sprach-Pendants).
- `scaffold-*.mjs` / `fix-embeds.mjs` — historische Extraktion aus der Live-Seite (nicht mehr nötig).

---

## 10. Deploy (Cloudflare Pages)

- Zwei Custom-Domains: **haushoppe.de** (DE) + **haushoppe.art** (EN → `/en/`).
- Build-Command: `npm run build`, Output: `dist/`.
- **CSP** (falls gesetzt) muss erlauben: `img-src i.ytimg.com`, `frame-src
  youtube-nocookie.com explorer.ordinalsbot.com www.google.com` (Video-Facade, Ordinals, Karte).
- Braucht die Cloudflare-Secrets des Betreibers.

## 11. Gotchas / Entscheidungen

- **Design-Referenz ist die Live-Seite** (haushoppe.de/.art sind noch online). Bei Änderungen
  am Look immer per Playwright/Screenshot gegen live vergleichen.
- **Kunstwerk-Bilder** sind höher aufgelöst als früher (1400 px statt 1024 px) — bewusst, für
  Schärfe; die Detailseite zeigt Kunst in voller Breite.
- **5 „Ordinals"** (Krypto-Werke) haben ein invertiertes Sonderdesign (`ArtworkBody.astro`).
- `public/artworks/` (webp) und `dist/`, `pagefind/` sind **gitignored** — beim Deploy neu erzeugt.
- Ausführliche Historie & Entscheidungen: **`MIGRATION-PLAN.md`**.
```
