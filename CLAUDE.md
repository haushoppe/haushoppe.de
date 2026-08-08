# CLAUDE.md — HAUS HOPPE (haushoppe.de / haushoppe.art)

Arbeitsanleitung & Architektur-Doku für dieses Repo. Für Claude Code **und** für Menschen,
die morgen Inhalte pflegen wollen.

---

## 1. Was ist das?

Die Website der **HAUS HOPPE – Galerie für Bildende Kunst** (Künstler **Olaf Hoppe**),
migriert von WordPress zu einer **statischen Astro-Site**.

- **Astro 5**, reines SSG (kein Server, keine DB, kein WordPress mehr).
- **Zweisprachig, Sprache = Domain**: Deutsch → **haushoppe.de**, Englisch → **haushoppe.art**.
  **Ein Projekt, zwei Builds** (`SITE_LANG=de|en`), jede Sprache am **Root** ihrer Domain —
  **kein `/en/`-Pfad**. Die Build-Sprache kommt zentral aus `src/lib/lang.ts`.
- **645 Kunstwerke**, Galerie mit Justified-Layout + Filter, Video-Seite, ein paar
  Content-Seiten, Volltextsuche.
- **Design = wie die alte Seite** (Astra-Theme-Look), aber sauber & schlank neu gebaut:
  kein Gutenberg-Markup mehr, kein `ast-*`-Theme-Ballast, CSS von 557 → 53 KB.

### Befehle

```bash
npm run dev         # Entwicklung (localhost:4321, DE) — Suche funktioniert hier NICHT (siehe Suche)
                    # EN im Dev: SITE_LANG=en npm run dev
npm run build       # Produktion: i18n-Check → BEIDE Sprach-Builds (dist-de + dist-art) + Pagefind
npm run check       # nur der i18n-Vollständigkeits-Check (läuft auch automatisch vor jedem build)
npm run preview     # DE-Build ansehen (dist-de, inkl. Suche) — zum Testen nutzen
npm run preview:art # EN-Build ansehen (dist-art)
npm run images      # Kunstwerk-Bilder neu erzeugen (scripts/gen-images.mjs → artworks-media.json)
npm run meta        # Werk-Beschriftungen neu generieren (artwork-meta.json)
npm run lang-alt    # Sprach-Pendant-Map neu generieren (lang-alt.json)
```

> **Wichtig:** `npm run build` baut **beide** Sprachen (`dist-de` = haushoppe.de, `dist-art` =
> haushoppe.art) und bricht ab, wenn der **i18n-Check** eine Lücke findet (siehe Abschnitt 7).
> Die **Suche** (Pagefind) entsteht erst im `build`-Schritt — zum Prüfen `npm run build` + `preview`.

---

## 2. Projektstruktur

**Kein `/en/`-Ordner mehr.** Es gibt *einen* Satz Seiten; die Sprache wählt der Build über
`SITE_LANG` (aus `src/lib/lang.ts`). Seiten mit gleichem Slug in beiden Sprachen (Home, Videos,
Vita, Werk-Detail) sind je *eine* Datei; die 3 Seiten mit **abweichendem** Slug stecken in einer
dynamischen `[slug].astro`.

```
src/
├── pages/                    # jede Datei = eine Route; Sprache aus SITE_LANG
│   ├── index.astro            # Startseite (de/en-Objekt je Build)        → Home.astro
│   ├── videos.astro           # Videos                                     → VideosGallery.astro
│   ├── vita.astro             # Vita                                       → Vita.astro + vita-<lang>.mdx
│   ├── [slug].astro           # die 3 slug-abweichenden Seiten:
│   │                          #   werke↔artwork · kunst-erwerben↔buy-fine-art · kontakt↔contact
│   └── portfolio/[slug].astro # 322 Werk-Detailseiten (filtert nach SITE_LANG)
├── content/pages/*.mdx       # Prosa-Seiten: home/kontakt/acquire, je -de.mdx + -en.mdx
├── content.config.ts        # Zod-Schema der MDX-Collection „pages"
├── components/               # siehe Abschnitt 4
├── layouts/BaseLayout.astro  # HTML-Gerüst: <head> inkl. canonical + hreflang (beide Domains)
├── lib/                      # lang.ts (SITE_LANG + Domains!), artworks.ts (Galerie-Daten), ordinals.ts
├── data/                     # Inhalts- & Konfig-Daten (siehe Abschnitt 5)
├── styles/                   # global.css (Basis) + wp-design.css (schlanke Galerie-Reste)
public/
├── media/…                   # alle Bilder (aus WP-Uploads, /media/JJJJ/MM/…)
├── artworks/<id>.webp        # web-optimierte Kunstwerk-Bilder (gitignored, per gen-images)
├── js/, vendor/jquery.min.js, ayg-plugin/…   # Galerie-/Video-Slider-Assets
dist-de/   dist-art/          # zwei Build-Outputs: DE → haushoppe.de, EN → haushoppe.art (gitignored)
scripts/                      # Generier-/Prüf-Skripte (siehe Abschnitt 9)
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
| `Home.astro`          | Startseite: Hero-Video-Facade + 2 Spalten (Text/Signatur | Werk/Links). Inhalt aus `index.astro` (`de`/`en`-Objekt, Auswahl über `LANG`). |
| `Gallery.astro`       | Galerie: Kategorie-Filter + Justified-Grid (`public/js/vp-justified.js`). Items aus `lib/artworks.ts`. |
| `VideosGallery.astro` | Video-Seite: der **echte** „ayg Classic-Slider" (Original-Plugin), Block-HTML aus `data/live-videos*.json`. |
| `AcquireArt.astro`    | Kunst Erwerben: Rahmen (Hero + Titel aus MDX-Frontmatter) + Layout-CSS; Inhalt (Portrait/Intro/Akkordeon) als `<slot/>` aus `content/pages/acquire-<lang>.mdx`. |
| `AccordionItem.astro` | Ein `<details>`-Akkordeon-Eintrag (kein JS) für die Kunst-Erwerben-MDX (`<AccItem title="…">…</AccItem>`). |
| `Kontakt.astro`       | Rahmen + Layout-CSS für die Kontakt-Seite; Inhalt als `<slot/>` aus `content/pages/kontakt-<lang>.mdx` (Klassen `.cp-center`, `.cp-directions`, `.cp-map`). |
| `Vita.astro`          | Rahmen für die Vita (Hero + Titel aus MDX-Frontmatter) + Listen-CSS (Jahres-Spalte via `li strong`); Inhalt als `<slot/>` aus `content/pages/vita-<lang>.mdx`. |
| `ArtworkBody.astro`   | Inhalt einer Detailseite: normal das große Bild, bei den 5 Ordinals stattdessen iframe + Kauf-Link (invertiertes Design). |
| `Search.astro`        | Pagefind-Overlay, öffnet beim Klick auf das Such-Icon (`[data-search-trigger]`). |

---

## 5. Inhalt & Daten — was liegt wo?

**Faustregel:** **Prosa → MDX**, **strukturierte Listen/Config → JSON/TS**.

**Prosa/Inhalt (`src/content/pages/*.mdx`, Content-Collection `pages`):**
- `home-*`, `kontakt-*`, `acquire-*`, `vita-*` (je `-de.mdx` + `-en.mdx`).
- **Frontmatter** = strukturierte Assets (Bilder, Video-ID, Karte, Titel); **Body** = editierbarer Markdown-Inhalt
  (bei der Vita auch die Listen als Markdown-Bullets — leicht zu erweitern).
- Dateiname-Konvention: `<name>-<lang>.mdx` — **Bindestrich, kein Punkt** (die Glob-`id` entfernt Punkte!). Schema/Validierung: `src/content.config.ts`.

**Strukturierte Daten (`src/data/`):**
- `site.ts` — **Navigation, Social-Links, Kontaktadresse, Logo** (DE+EN, typisiert). Config, kein Fließtext → bleibt TS.
- `artworks.json` — alle Kunstwerke (id, slug, title, lang, **trid**, categories, date, content …). **Site-Quelle** (Single Source of Truth).
- `artworks-media.json` — je Kunstwerk `{src,w,h}` des webp-Bildes (per `gen-images`).
- `artwork-meta.json` — strukturierte, **von Hand editierbare** Werk-Beschriftung je `trid` (Künstler·Titel·Jahr·Technik·Maße·Nummer + optional Auflage/Extra, DE+EN). Per `gen-artwork-meta.mjs`, gerendert von `ArtworkMeta.astro`. Unbekannte Maße = `"?"` (wird ausgeblendet).
- `lang-alt.json` — DE↔EN-Pendant je URL, **root-relativ** (Header stellt die andere Domain davor). Per `gen-lang-alt.mjs` (liest die Site-Quelle).
- `live-videos.json` / `live-videos-en.json` — der server-gerenderte Video-Slider-Block.
- `videos-playlist.json` — die 25 Video-IDs/Titel (Referenz).

**Migrations-Altlasten (nicht importiert, können ignoriert/gelöscht werden):**
`attachments.json`, `menus.json`, `pages.json`, `translations.json`.

---

## 6. ✏️ Inhalte pflegen — „morgen neue Inhalte"

### Startseite ändern (Text, Willkommen, hervorgehobenes Werk, Hero-Video)
**MDX:** `src/content/pages/home-de.mdx` (DE) und `home-en.mdx` (EN). Der **Body** ist der Intro-Fließtext
(Markdown). Im **Frontmatter**: `video.id` (YouTube-ID), `h1`, `welcome` (Signaturblock), `featured`
(Werkbild + Bildunterschrift + Link). Bilder in `public/media/…`.

### Kontakt ändern
**MDX:** `src/content/pages/kontakt-de.mdx` / `kontakt-en.mdx`. Fließtext (Öffnungszeiten, Adresse,
Anfahrt) direkt im Body als Markdown. Layout-Hooks: `<div class="cp-center">…</div>` (zentrierter Block),
`<div class="cp-directions">…</div>` (2-Spalten Anfahrt|Karte), `<iframe class="cp-map" …>` (Google-Maps-URL).

### Kunst Erwerben ändern
**MDX:** `src/content/pages/acquire-de.mdx` / `acquire-en.mdx`. Intro + Akkordeon als Markdown; die
Akkordeon-Einträge sind `<AccItem title="…">…Prosa…</AccItem>`. Frontmatter: `hero` (Bild). Portrait als
`<figure class="acq-portrait">` im Body.

### Vita ändern
**MDX:** `src/content/pages/vita-de.mdx` / `vita-en.mdx`. Lebenslauf = Markdown-**Tabelle** (`| Jahr | Ereignis |`),
Ausstellungen = 3-Spalten-**Tabelle** (`| Jahr | Ausstellung | Art |`, Art = AB/EA), Galerien/Museen = Bullet-Listen.
Neue Ausstellung = eine neue Tabellenzeile. Frontmatter: `title`, `h1` („Olaf Hoppe"), `hero`.

### Navigation, Social-Links, Kontaktadresse, Logo
**`src/data/site.ts`** — eine Datei für alles. Menüpunkte in `nav.de` / `nav.en`, Socials in
`socials`, Adresse in `contact`.

### Neues Kunstwerk hinzufügen
Datengetrieben (kam aus dem WP-Export). **Immer DE UND EN anlegen** — der i18n-Check (Abschnitt 7)
bricht den Build sonst ab. Schritte:
1. **Bild** als webp nach `public/artworks/<id>.webp` (max ~1400 px; `npm run images` erzeugt sie sonst
   aus WP-Uploads).
2. Eintrag in `src/data/artworks-media.json`: `"<id>": { "src":"/artworks/<id>.webp","w":…,"h":… }`.
3. **Zwei** Einträge in `src/data/artworks.json` (DE + EN) mit **gleicher `trid`** (verbindet die Sprachen):
   `id, slug, title, lang, trid, date, categories:[{taxonomy:"portfolio_category",slug,name}], content`.
   Die Beschriftung entsteht aus `content` (figcaption) via `npm run meta`.
4. `npm run meta` (Beschriftung) + `npm run lang-alt` (Sprachwechsel) + `npm run build`. Der Check meldet
   sofort, falls DE oder EN (oder ein Bild) fehlt.

> Tipp: Wenn viele neue Werke kommen, lohnt eine `artworks/*.md`-Content-Collection statt der JSON.

### Video hinzufügen (Achtung: Sonderfall)
Die Video-Seite nutzt noch den **kopierten Slider-Block** aus `data/live-videos*.json` (echtes
Plugin-Markup). Ein Video ergänzen = ein `<div class="ayg-video …">…</div>` im JSON nachbauen.
Unkomfortabel — wenn du die Videos öfter pflegen willst, sollten wir die Video-Seite auf eine
saubere, datengetriebene Variante (Liste aus `videos-playlist.json`) umstellen.

### Neue Seite anlegen
**Kein `/en/`-Ordner** — es gibt einen Satz Seiten, die Sprache kommt aus `LANG` (`src/lib/lang.ts`).
Prosa-Seite: `src/content/pages/<name>-de.mdx` + `<name>-en.mdx` anlegen, dazu eine `.astro`-Route,
die den passenden Eintrag lädt:
```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import { getCollection, render } from 'astro:content';
import { LANG } from '../lib/lang';
const pages = await getCollection('pages');
const entry = pages.find((p) => p.id === `neueseite-${LANG}`);
const { Content } = await render(entry!);
---
<BaseLayout title={entry!.data.title} description={entry!.data.description}><Content /></BaseLayout>
```
Slug pro Sprache gleich → eigene Datei; **abweichender** Slug (wie werke↔artwork) → in die dynamische
`src/pages/[slug].astro` aufnehmen. Danach in `src/data/site.ts` den Menüpunkt (DE+EN) und in
`scripts/gen-lang-alt.mjs` das Pfad-Paar ergänzen, dann `npm run lang-alt`.

---

## 7. Zweisprachigkeit (i18n)

> **⭐ Deutsch ist immer führend.** DE ist die Quell-/Leitsprache, Englisch ist die
> **1:1-Übersetzung** davon. Neue Inhalte immer zuerst auf Deutsch schreiben, dann EN
> übersetzen. EN-Seiten sollen inhaltlich der DE-Fassung entsprechen (nicht abweichen).

- **Domain = Sprache**, **kein `/en/`-Pfad.** Zwei Builds über `SITE_LANG` (`src/lib/lang.ts`):
  `de` → `dist-de` → haushoppe.de, `en` → `dist-art` → haushoppe.art. `hreflang`/`canonical`
  spannen über beide Domains (in `BaseLayout.astro`).
- Der **Sprachumschalter** (Flagge im Header) zeigt aufs Pendant auf der **anderen Domain**
  (absolute URL). Zuordnung: `src/data/lang-alt.json` (root-relativ; Header stellt die Domain davor).
- Verknüpfte DE/EN-Kunstwerke haben dieselbe **`trid`** in `artworks.json`.

**🔒 Vollständigkeits-Garantie (`npm run check`, läuft vor jedem `build`):**
`scripts/check-i18n.mjs` bricht den Build ab, wenn (a) ein Werk nicht in **beiden** Sprachen
existiert oder ein **Bild** fehlt, oder (b) eine **MDX-Seite** (home/kontakt/acquire/vita) in einer
Sprache fehlt. So kann nie still eine Übersetzung fehlen. Unbekannte Maße bei Werken werden als `"?"` migriert (Renderer blendet sie aus).

## 8. Suche (Pagefind)

Clientseitige Volltextsuche. Der Index entsteht beim `build` (`pagefind --site dist-de` bzw.
`dist-art`, je Sprache getrennt) und liegt unter `dist-*/pagefind/`. `data-pagefind-body` steckt auf `<main>`; Galerie-Grids sind
per `data-pagefind-ignore` ausgenommen (Detailseiten sind die Suchziele). DE/EN werden über
`<html lang>` automatisch getrennt. **Nur im `preview`/Prod sichtbar, nicht im `dev`.**

## 9. Skripte (`scripts/`)

Generieren/Prüfen (aus der **Site-Quelle** `src/data/`, nicht aus dem Migrations-Snapshot):
- `check-i18n.mjs` — **Vollständigkeits-Gate** (`npm run check`, läuft vor jedem Build). Siehe Abschnitt 7.
- `gen-artwork-meta.mjs` — `npm run meta`: baut `artwork-meta.json` (Werk-Beschriftung) aus den
  `content`-Captions. Von Hand ergänzte Maße/Extra überleben eine Neugenerierung.
- `gen-lang-alt.mjs` — `npm run lang-alt`: `data/lang-alt.json` (Sprach-Pendants, root-relativ).
- `gen-images.mjs` — `npm run images`: WP-Uploads → `public/artworks/<id>.webp` + `artworks-media.json`.
- `qa-artwork-meta.mjs` — Prüfbericht über die Werk-Beschriftungen (Parse-Anomalien).
- `scaffold-*.mjs` / `fix-embeds.mjs` — historische Extraktion aus der Live-Seite (nicht mehr nötig).

---

## 10. Deploy (Cloudflare Pages)

- **Zwei Builds, zwei Domains:** `npm run build:de` → `dist-de/` → **haushoppe.de**,
  `npm run build:art` → `dist-art/` → **haushoppe.art**. `npm run build` macht beide (mit i18n-Check).
  Kein `/en/`-Pfad — jede Sprache liegt am Root ihrer Domain.
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
