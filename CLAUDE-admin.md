# CLAUDE-admin.md — HAUS HOPPE (Entwickler-/AI-Referenz)

Technische Referenz für dieses Repo (haushoppe.de / haushoppe.art) — für **Johannes** und den **AI-Assistenten**: Architektur, Build, Datenmodell, Kauf-Flow, Deployment. Hier gelten **keine** Inhalts-Guardrails; voller Zugriff auf den ganzen Code.

> Die eingeschränkte **Redaktions**-Anleitung (für Olaf, non-technical: nur Inhalte, PR-Flow, feste Dateiliste) steht in `CLAUDE.md`. Diese Admin-Referenz wird **nicht** automatisch geladen — bewusst heranziehen, wenn an Code/Architektur/Deployment gearbeitet wird. Wo es um reine Inhaltspflege geht, ist `CLAUDE.md` die Quelle (z. B. „Neues Werk hinzufügen" = Rezept E dort).

---

## 1. Überblick

- **Astro 5, reines SSG.** Kein Server, keine DB, kein WordPress. Die dynamischen Teile (Kauf, Widerruf) laufen als **Cloudflare Pages Functions** (Abschnitt 8).
- **Sprache = Domain.** Deutsch → **haushoppe.de**, Englisch → **haushoppe.art**. **Ein Projekt, zwei Builds** über `SITE_LANG`; jede Sprache liegt am **Root** ihrer Domain — **kein `/en/`-Pfad**.
- **Inhalte:** Galerie (Justified-Layout + Kategorie-Filter + Lightbox), Werk-Detailseiten mit **Direktkauf** (PayPal) für Holzschnitte, Video-Seite (YouTube), Prosa-Seiten (MDX), Volltextsuche (Pagefind).
- **Styling:** Tailwind v4 (CSS-first) plus schlanke Basis-Tokens in `global.css`.
- **Quelle der Wahrheit ist git.** Werkverzeichnis + Bild-Master liegen versioniert im Repo; nichts hängt an einem externen Dump oder Snapshot.

---

## 2. Befehle

```bash
npm run dev          # Entwicklung (localhost:4321, DE). EN: SITE_LANG=en npm run dev
                     # Suche (Pagefind) entsteht erst im build → im dev NICHT sichtbar
npm run build        # Produktion: data → i18n-check → build:de → build:art (beide inkl. Pagefind)
npm run check        # nur der i18n-Vollständigkeits-Check (läuft auch im build)
npm run data         # abgeleitete Daten erneuern → derzeit: videos.json (YouTube-Playlist)
npm run build:de     # nur DE: astro build (dist-de) + Bild-Prune + Pagefind
npm run build:art    # nur EN: astro build (dist-art) + _redirects + Bild-Prune + Pagefind
npm run preview      # dist-de ansehen (inkl. Suche). preview:art → dist-art
npm run e2e          # Playwright-Suite (baut NICHT; erwartet dist-de/dist-art gebaut)
npm run deploy       # lokaler Full-Deploy via wrangler (Cloudflare-Auth nötig) — sonst per Action
```

Der reguläre Deploy läuft über die **GitHub Action** (Abschnitt 9), nicht über `npm run deploy`.

---

## 3. Sprache = Domain (`SITE_LANG`)

- `src/lib/lang.ts`: `LANG` kommt aus `import.meta.env.SITE_LANG` (in `astro.config.mjs` via `vite.define` literal injiziert). `DE_ORIGIN`/`EN_ORIGIN`, `SELF_ORIGIN`/`OTHER_ORIGIN`.
- `astro.config.mjs` setzt je Build `site` + `outDir`: `de → dist-de`, `en → dist-art`. `hreflang`/`canonical` in `BaseLayout.astro` spannen über beide Domains.
- **Sprachumschalter (Flagge):** zeigt aufs Pendant auf der **anderen** Domain (absolute URL). Die Pendant-Map wird zur **Laufzeit** aus den Collections abgeleitet — `buildAltMap()` in `src/lib/paths.ts` (geroutete Seiten, Kategorien, Werke aus der `artworks`-Collection, Standalone-Seiten aus der `pages`-Collection). Keine gepflegte `lang-alt.json`.

---

## 4. Projektstruktur

```
src/
├── pages/
│   ├── index.astro            # Startseite            → Home.astro
│   ├── videos.astro           # Videos                → VideosGallery.astro
│   ├── vita.astro             # Vita                  → Vita.astro + vita-<lang>.mdx
│   ├── [slug].astro           # slug-abweichende Seiten: werke↔artwork · kunst-erwerben↔buy-fine-art · kontakt↔contact
│   ├── [slug]/[category].astro# Galerie-Kategorieseiten (z. B. /werke/holzschnitte/)
│   ├── portfolio/[slug].astro # Werk-Detailseiten (Slug = sprachspezifisch)
│   ├── 404.astro  robots.txt.ts
├── content/
│   ├── pages/*.mdx            # Prosa: home/kontakt/acquire/vita, je -de.mdx + -en.mdx
│   └── artworks/*.md          # EIN File pro Werk, beide Sprachen im Frontmatter
├── content.config.ts         # Zod-Schemata der Collections `pages` + `artworks`
├── components/                # siehe Abschnitt 6
├── layouts/BaseLayout.astro   # HTML-Gerüst: <head> (Titel/Desc/OG/JSON-LD, canonical+hreflang), Header, main, Footer, Search
├── lib/                       # lang.ts, paths.ts, artworks.ts, categories.ts, ordinals.ts, pricing.ts, seo.ts, person.ts, text.ts, pages.ts, banner-images.ts, content-images.ts
├── scripts/                   # gallery.js (Justified-Layout + Lazy-Reveal), yt-facade.js (Video-Klick-Facade)
├── data/                      # site.ts, videos.json, en-slug-redirects.json (Abschnitt 5)
├── styles/global.css          # Tailwind-Import + Design-Tokens + Basis-Layout
└── artwork-originals/         # Master-Archiv (Nachlass, versioniert) — Abschnitt 7
functions/api/                 # Cloudflare Pages Functions (Kauf + Widerruf) — Abschnitt 8
public/                        # media/ (Seitenbilder), logo.svg, Favicons, og-default.png, _headers, _redirects, ayg-plugin/, wp-content/…/flags/
dist-de/  dist-art/            # zwei Build-Outputs (gitignored)
```

---

## 5. Inhalt & Datenmodell — die Quelle ist git

**Werkverzeichnis = Content Collection.** `src/content/artworks/*.md` ist die **einzige** Werk-Quelle: eine Datei pro Werk, beide Sprachen im Frontmatter (`de:`/`en:`-Blöcke), `image()` zeigt auf den Master im Archiv. Schema in `content.config.ts`. Galerie-Reihenfolge/Prev-Next kommen aus `lib/artworks.ts` (Sortierung nach Werk-**Nummer** absteigend, `order` als Tiebreaker). Holzschnitt-Erkennung + fester Preis in `lib/pricing.ts` (`-HZ`-Nummer **oder** „Holzschnitt"-Technik → 785 €).

**Prosa = MDX.** `src/content/pages/*.mdx` (`home/kontakt/acquire/vita`, je `-de`/`-en`). Frontmatter = strukturierte Assets (Bild, Video-ID, Karte); Body = editierbarer Markdown. Dateiname mit **Bindestrich**, kein Punkt (die Glob-`id` entfernt Punkte).

**Konfig/kleine Daten (`src/data/`):**
- `site.ts` — Navigation (DE/EN), Social-Links, Kontaktadresse, Logo. Typisiert.
- `videos.json` — YouTube-Videos (ID/Titel), erzeugt von `gen-videos`.
- `en-slug-redirects.json` — Slug-Weiterleitungen für die EN-Site (`gen-en-redirects` schreibt `_redirects`).

Es gibt **keine** `artworks.json`, `artwork-meta.json`, `artworks-media.json`, `lang-alt.json` mehr — diese WP-Ableitungen sind entfallen; die Collections sind die Quelle.

---

## 6. Komponenten (die wichtigsten)

| Komponente | Aufgabe |
|---|---|
| `BaseLayout.astro` | HTML-Gerüst + `<head>` (Titel/Description mit Längenlogik, OG/Twitter, JSON-LD, `theme-color`, canonical+hreflang). Props: `title`, `description`, `layout`, `type`, `image`, `jsonLd`, `noindex`, `inverted`. Lädt global `gallery.js`/`yt-facade.js`. |
| `Header.astro` | Logo + Nav (aus `data/site.ts`) + Sprach-Flagge (Pendant via `paths.ts`) + Such-Icon; mobil Burger. |
| `Footer.astro` | Marken-Spalte + Spalten Folgen/Galerie/Rechtliches + Baseline. Socials + Rechtstexte; Adresse/Telefon stehen bewusst nur auf Kontakt/Impressum. |
| `Gallery.astro` | Kategorie-Filter + Grid; `src/scripts/gallery.js` veredelt zum absoluten Justified-Layout + Lazy-Reveal. `<Picture>` (astro:assets). |
| `ArtworkBody.astro` | Detail-Inhalt: Bild + `ArtworkMeta` + (bei Holzschnitten) `WoodcutBuy` + „Unverbindlich anfragen"-mailto. Bei den 5 Ordinals stattdessen iframe-Bühne + Kauf-Link (invertiert). |
| `WoodcutBuy.astro` | PayPal-Smart-Buttons (Direktkauf, fester Preis). Ohne konfigurierte Functions bleiben die Buttons weg → E-Mail-CTA übernimmt. |
| `VideosGallery.astro` | Video-Seite aus `data/videos.json`; `yt-facade.js` lädt das `youtube-nocookie`-iframe erst per Klick. |
| `Home / AcquireArt / Kontakt / Vita / Page` | Rahmen für die jeweilige Seite; Inhalt als `<slot/>` aus dem passenden MDX. |
| `Search.astro` | Pagefind-Overlay (Trigger `[data-search-trigger]`). |
| `Lightbox.astro` | Zoom-Blättern auf Werk-Detailseiten. |

---

## 7. Werk-Bilder — das Nachlass-Archiv

`src/artwork-originals/` ist das **versionierte Master-Archiv** (Olafs digitaler Nachlass) und zugleich die **Build-Vorlage**: `astro:assets` erzeugt beim Build die ausgelieferten **AVIF + WebP** in mehreren Größen (`<Picture>`/`getImage`). Nichts Abgeleitetes wird versioniert (kein `public/artworks/`). Master als **AVIF q80** in voller Auflösung ablegen — **nie hochskalieren**. Ablage + Regeln im Detail: `CLAUDE.md` → „🗄️ Langzeit-Archiv" und Rezept E.

---

## 8. Kauf-Flow + Widerruf (Cloudflare Pages Functions)

`functions/api/` (laufen **nur produktiv** auf Cloudflare — lokal in `preview`/e2e fehlen sie, daher Graceful Degradation):

- **PayPal-Direktkauf (Holzschnitte):** `paypal/config.js` (liefert `enabled` + Client-ID + Umgebung an den Client), `create-order.js`, `capture-order.js`; Helfer `_paypal.js` (PayPal-REST) + `_email.js` (Bestätigung). Fester Preis aus `lib/pricing.ts`, Versand nur **DACH**, Vertragsschluss erst mit Versand. Nach erfolgreicher Zahlung (`COMPLETED` **oder** `PENDING`) Bestätigungs-E-Mail via **Resend**.
- **Widerruf-Formular:** `widerruf.js` + `_widerruf-email.js` (verschickt die Widerrufserklärung).
- **Env (in Cloudflare Pages gesetzt, nicht im Repo):** `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV` (sandbox/live), `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_TO`.

---

## 9. Deploy (GitHub Action → Cloudflare Pages)

`.github/workflows/deploy.yml`:
- **Trigger:** Push auf `main`; zusätzlich **nächtlich** (Cron `0 3 * * *`) — der Nacht-Build zieht die aktuelle YouTube-Playlist (`gen-videos`), damit neue Videos automatisch erscheinen. Auch manuell (`workflow_dispatch`).
- **Schritte:** node 22 → `npm ci` → `npm run build` (bricht bei i18n-Lücke/Build-Fehler ab, dann **kein** Deploy) → `wrangler pages deploy` je Sprache (`deploy:de` → Projekt `haushoppe-de`, `deploy:art` → `haushoppe-art`).
- **Secrets:** `CLOUDFLARE_API_TOKEN`, `YOUTUBE_API_KEY` (Account-ID steht im Klartext, ist kein Credential). Die Function-Secrets (PayPal/Resend) liegen in der Cloudflare-Pages-Umgebung.

Arbeitsweise: auf einem **Branch** entwickeln, lokal `npm run build` + `npm run e2e` grün, dann nach `main` mergen → die Action deployt.

---

## 10. Skripte (`scripts/`)

- `check-i18n.mjs` — **i18n-Gate** (`npm run check`, vor jedem Build): bricht ab, wenn ein Werk nicht in **beiden** Sprachen existiert, ein **Bild** oder die **Nummer** fehlt, oder eine MDX-Seite in einer Sprache fehlt.
- `gen-videos.mjs` — `npm run videos`/`data`: YouTube-Playlist (`YOUTUBE_API_KEY`) → `src/data/videos.json`. Fällt ohne Key auf die vorhandene Datei zurück.
- `gen-en-redirects.mjs` — schreibt `dist-art/_redirects` aus `data/en-slug-redirects.json` (Teil von `build:art`).
- `prune-unreferenced-images.mjs` — entfernt nach dem Build nicht referenzierte `_astro`-Bilder (Teil von `build:de`/`build:art`).

---

## 11. Tests (Playwright)

- `e2e/` — Projekte `de`/`en` (Desktop) + `de-mobile`/`en-mobile`; `playwright.config.ts` serviert `dist-de` (:4321) und `dist-art` (:4322) via `python3 -m http.server`. Also **erst bauen**, dann `npm run e2e`.
- **Katalog-Zähler sind bewusste Invarianten** (fangen versehentlichen Datenverlust). Bei jedem neuen/entfernten Werk mitziehen: Gesamtzahl in `e2e/gallery.spec.ts`, Kategorie-Zahl in `e2e/helpers/site.ts`, Holzschnitt-Zahl in `e2e/pricing.spec.ts`.
- **Sprachspezifische Tests** tragen ein Tag (`@de-only`/`@en-only`) und werden per `grepInvert` aus dem anderen Projekt gefiltert — kein Laufzeit-`test.skip`, keine „skipped"-Meldung.
- `/api/*`-404 im statischen Test-Server ist erwartet (Functions gibt es nur produktiv).

---

## 12. Gotchas

- **Screenshots gegen die echte Domain** per Playwright vergleichen (die Live-Seite ist diese Site). MCP-PNGs sind unerreichbar → lokales Playwright-Skript → Scratchpad → an den Nutzer liefern.
- **5 Ordinals** (Krypto-Werke) haben ein invertiertes Sonderdesign (`ArtworkBody.astro`, Layout `bleed`).
- **Eine Inhaltsbreite:** `--container` (72rem) für alle Wrapper; nur Galerie-Raster + Ordinal-Bühne sind full-bleed. **Keine runden Ecken** außer echten Kreisen. Details in `CLAUDE.md`.
- `dist-de`/`dist-art` und `dist-*/pagefind/` sind **gitignored** — beim Build neu erzeugt.
- Functions laufen nur produktiv → PayPal-Buttons/Widerruf-Versand lokal nicht testbar (Graceful Degradation greift).
