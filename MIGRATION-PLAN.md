# Migrationsplan: haushoppe.de (DE) + haushoppe.art (EN) → eine statische Astro-Site

> Lebendes Dokument. Ziel: Fokus halten, Entscheidungen festhalten, Fortschritt tracken.
> Playbook-Basis: der bereits abgeschlossene Rebuild **haushoppe-its.de** (Repo unter `~/Work/haushoppe-astro-rebuild/site`) wird als Scaffold und Entscheidungs-Referenz wiederverwendet.

## 1. Kontext & Ziel

Zwei EOL-WordPress-Auftritte (eine **Multisite + WPML**) werden zu **einer statischen Astro-Site** zusammengeführt, ausgeliefert unter **zwei Domains, wobei die Domain die Sprache bestimmt**: `haushoppe.de` = Deutsch, `haushoppe.art` = Englisch. Es ist die Künstler-Website von Johannes Hoppe (Malerei/Fotografie/Digital-Art). **Kein Blog.** Besonderheiten: **bild-/kunstwerklastig** und **Design wird exakt übernommen** (alte WP-Seite und neue Astro-Seite sollen gleich aussehen).

## 2. Quelle — Fakten aus der Analyse (beobachtet)

Verzeichnis: `~/Work/haushoppe.de-astro-rebuild/` (12 GB).
- `backup_2026-08-05-…-db.gz` → 30 MB SQL (komplette Netzwerk-DB).
- `wordpress/wp-content/uploads` — **1,3 GB, ~5028 Bilddateien** (Kunstwerke + WP-Thumbnails).
- `wordpress/wp-content/updraft` — **11 GB, nur UpdraftPlus-Backups → ignorieren.**

Es ist eine **WordPress-Multisite mit WPML**:
- **Ziel = Blog 1** (`wp_`-Präfix, trägt die WPML-Tabellen `wp_icl_*`) → `haushoppe.de` + `haushoppe.art` als **Domain-pro-Sprache**.
- **Ausschließen = Blog 2** (`wp_2_`-Präfix) → **`theangelswing.art`**, ein anderes Projekt. Child-Theme „Wings" gehört dazu.

**Inhaltsinventar (Blog 1, sauber geparst):**

| Typ | Menge (publish) | Bedeutung |
|---|---|---|
| `portfolio` | **643** | die **Kunstwerke** (Visual-Portfolio-CPT), DE+EN |
| `page` | **19** | Seiten, DE+EN |
| `post` | **2** | ein einzelnes Werk „Die Ebenen des Glücks / The levels of happiness 2021" (DE+EN) → **als Kunstwerk übernehmen** |
| `attachment` | 994 | Medien (Filesystem: 5028 Dateien inkl. Thumbnails) |
| `nav_menu_item` | 18 | Menüs |
| `revision` / `flamingo_*` | 915 / 7 | ignorieren |

**Seiten (19, DE/EN gemischt):** Start, Vita, Werke/Artwork (Galerie), Videos (YouTube-Playlist), Kunst-Erwerben/Buy Fine Art, Kontakt/Contact — plus Krypto-Infoseiten: „NFT kaufen – die vollständige Anleitung"/„Buy NFTs – the complete guide", „Hintergrundwissen zu Blockchain-Token"/„Background knowledge on blockchain tokens", „On Cyber galleries and Collabs". (Einige Krypto-Seiten sind inhaltlich unfertig — beim Migrieren pro Seite entscheiden.)

**Design-Quelle:** **Astra 4.13.6** (Parent) + Astra-Customizer-Settings + Astra-Sites-Starter **„eric-template-08"** + **44 Zeilen** Child-CSS (`astra-childtheme`) + Gutenberg-Blöcke pro Seite (UAG/Stackable) + **Visual Portfolio Pro** für die Galerien. → „Exakt übernehmen" = Astra/Visual-Portfolio-Ausgabe originalgetreu nachbauen, per Screenshot-Vergleich absichern.

## 3. Getroffene Entscheidungen (fix — nicht neu aufrollen)

- **Sprache = Domain:** `haushoppe.de` = DE, `haushoppe.art` = EN. URLs/Permalinks erhalten.
- **Design exakt** nachbauen; Abnahme per Screenshot-Diff alt↔neu (mehrere Breakpoints, beide Sprachen).
- **Galerie 1:1:** Visual-Portfolio-Look inkl. responsivem Verhalten, Kategorie-Filter, Lightbox, Hover — genau wie jetzt (wurde lange feinjustiert).
- **Bilder:** Rohdaten **verlustfrei archivieren** (kein weiterer Qualitätsverlust an den Originalen); **ausgeliefert** wird komprimiert/skaliert (webp o. ä.) — nur kaum merklicher Verlust erlaubt. **Kein Klau-Schutz**, volle Qualität.
- **YouTube-Videos** (aus Playlist) **übernehmen**, Design bleibt.
- **NFT/OpenSea-Technik raus.** Die **5 „Ordinals"-Werke bleiben** — technisch nur **iframe + Link**, plus ein **abweichendes Design (invertierte Farben)**.
- **NFT-/Krypto-Infoseiten** bleiben — **aber nur die mit fertigem Inhalt** (unfertige weglassen; Entscheidung beim Sehen des Inhalts).
- **Contact Form 7 / Flamingo raus** (nicht mehr genutzt).
- **theangelswing.art** und **updraft**-Backups komplett ignorieren.
- Playbook-Übernahme: Astro 5 SSG, `astro:assets`, Content Collections, Cloudflare Pages + `deploy.yml`, `_headers` (Security/CSP), Sitemap/robots/OG, strukturierte Daten, Playwright-Verifikation, saubere Umlaute.

## 4. Offene Entscheidungen (vor/bei der Umsetzung klären)

- **[D1] i18n-Deploy-Strategie (wichtig):** Domain=Sprache bei statischem Cloudflare-Pages.
  - Option A — **zwei Builds/Deploys**: ein Astro-Projekt, Build-Flag `LANG=de|en` → `dist` je Sprache mit **sauberen Root-URLs** (kein `/en`-Präfix), zwei Pages-Projekte/Domains. *Pro:* URLs exakt wie heute, einfachstes Routing. *Contra:* Bild-Ableitungen werden 2× erzeugt (Build-Zeit/Storage).
  - Option B — **ein Build + Host-Routing** (Cloudflare Pages Function liest `Host`, mappt `haushoppe.de`→DE-Baum, `haushoppe.art`→EN-Baum): teilt die Bild-Ableitungen, etwas mehr Routing-Logik.
  - *Lean:* A (Klarheit/URL-Treue), außer die doppelte Bildverarbeitung wird zum Problem → dann B. **In Phase D final entscheiden.**
- **[D2] Kunstwerk-Metadaten:** Welche Felder existieren pro Werk (Jahr, Technik/Medium, Maße, Preis/Verfügbarkeit, Kategorie, Tags)? → in Phase A/B aus `wp_postmeta` + Visual Portfolio erheben, dann Schema finalisieren.
- **[D3] Galerie-Struktur:** Wie sind die 643 Werke gruppiert (portfolio-category), und welche Galerie-Layouts (`vp_lists`, 90 St.) liegen auf welchen Seiten? → in Phase B erheben.
- **[D4] Repo/Domain-Setup:** Neues Git-Repo (Name?) + Cloudflare-Pages-Projekt(e); Custom-Domains `haushoppe.de` + `haushoppe.art`.

## 5. Zielstruktur (Ordner)

```
~/Work/haushoppe.de-astro-rebuild/
├── wordpress/            # Quelle (Referenz, NICHT deployt)
├── backup_…-db.gz        # DB-Quelle
├── MIGRATION-PLAN.md     # dieses Dokument
├── migration/            # Node-Konverter + Zwischen-JSON + Roh-Archiv-Manifest
├── raw-archive/          # verlustfreie Original-Kunstwerke (Langzeit, nicht deployt)
└── site/                 # das Astro-Projekt = eigenes git-Repo → Cloudflare Pages
    ├── src/content/{artworks,pages}/      # + i18n-Aufteilung de/en
    ├── src/components/  src/layouts/  src/pages/
    ├── src/assets/ (bzw. public/)         # web-optimierte Bilder
    └── astro.config.mjs  package.json
```

## 6. Content-Schemas (Entwurf — final nach D2/D3)

**`artworks`** (Kunstwerk): `title`, `slug`, `lang` (de|en), `trid` (WPML-Übersetzungspaar-ID → verlinkt DE↔EN), `category`, `tags[]`, `image` (web-optimiert, responsive), `rawImage` (Verweis aufs Archiv), `year`, `medium?`, `dimensions?`, `available?`/`price?`, `description?`, sowie Sonderfelder für Ordinals: `ordinal?` (bool), `embedUrl?` (iframe), `externalUrl?` (Link), `invertColors?` (bool).

**`pages`** (Seite): `title`, `slug`, `lang`, `trid`, `blocks` (aus Gutenberg konvertiert), Sonderseiten-Typen (Galerie/Werke, Videos/YouTube-Playlist, Vita, Kontakt, Kunst-erwerben, NFT-Infoseiten).

**i18n-Verknüpfung:** `trid` aus `wp_icl_translations` löst je Element das DE/EN-Gegenstück auf → für `hreflang`, Canonical und den Sprachumschalter.

## 7. Phasen — konkrete Schritte, Deliverables, Status

### Phase A — Lokale WP-Referenz + Extraktion  ⬜
- [ ] DB-Dump lokal verfügbar machen (bereits entpackt unter Scratchpad; für Queries in echtes MySQL/Docker laden — verlässlicher als Dump-Parsing).
- [ ] Multisite/WPML lokal hochziehen (Astra 4.13.6, passende PHP-Version), **nur Blog 1 (haushoppe)** als **visuelle Referenz**; theangelswing/updraft aus.
- [ ] **Astra-Customizer-Settings** (`astra-settings`/`theme_mods`) + die 44 Zeilen Child-CSS als **Design-Tokens** exportieren (Farben, Typo, Header/Footer, Spacing).
- [ ] Referenz-Screenshots aller Seitentypen + Galerie (DE+EN, mehrere Breakpoints) als Abnahme-Baseline.
- **Deliverable:** laufende WP-Referenz + Design-Token-Export + Screenshot-Baseline.

### Phase B — Export (Content + Medien + Galerie-Configs)  ⬜
- [ ] Per `wp-cli`/SQL je Sprache exportieren: **Pages, Portfolio (Kunstwerke), Medien, Menüs, Taxonomien**.
- [ ] **WPML-Übersetzungspaare** (`icl_translations.trid`) als DE↔EN-Mapping ziehen.
- [ ] **Visual-Portfolio-Galerie-Configs** (`vp_lists`) + Zuordnung Galerie→Seite + Kategorie-Struktur extrahieren.
- [ ] **Kunstwerk-Metadaten** (`wp_postmeta`) erheben → D2 klären.
- [ ] **Alle Original-Uploads** sichern → `raw-archive/` (verlustfrei).
- **Deliverable:** strukturiertes Zwischen-JSON (artworks/pages/menus/i18n) + Roh-Archiv.

### Phase C — Konvertierung → Astro-Content  ⬜
- [ ] Kunstwerke → `artworks`-Collection (inkl. Ordinals-Sonderfelder, `trid`-Links, das 2021er „post"-Werk).
- [ ] Pages → `pages` (Gutenberg-Blöcke → Astro-Komponenten; unfertige NFT-Seiten prüfen/weglassen).
- [ ] **Bild-Pipeline:** Originale → `raw-archive/` (unverändert); web-optimierte Ableitungen via `astro:assets` (webp/avif, responsive) für die Auslieferung.
- [ ] URL-Schema erhalten (Permalinks, portfolio-Slugs, Sprach-Domains).
- **Deliverable:** vollständige Content-Collections + web-Bilder.

### Phase D — Astro-Projekt (Design exakt + i18n + Galerie)  ⬜
- [ ] Scaffold aus haushoppe-its.de (BaseLayout, `_headers`, `schema.ts`, `person.ts`, Bild-Setup, `deploy.yml`).
- [ ] **i18n** gemäß D1 (Domain=Sprache, hreflang/canonical, Sprachumschalter über `trid`).
- [ ] **Exaktes Design:** Astra-Header/Footer/Typo als Komponenten + Design-Tokens, per Screenshot-Diff kalibriert.
- [ ] **Visual-Portfolio-Galerie-Komponente** (responsives Grid/Masonry, Kategorie-Filter, Lightbox, Hover) — 1:1.
- [ ] **Kunstwerk-Detailseiten.**
- [ ] **YouTube-Playlist-Sektion** (Videos-Seite), Design wie gehabt, Klick-Facade (Datenschutz, wie im Playbook).
- [ ] **5 Ordinals** als iframe+Link mit **invertiertem Farbschema**.
- [ ] Strukturierte Daten: Person/Organization (Künstler) + je Werk `VisualArtwork`/`ImageObject`.
- **Deliverable:** funktionierende Astro-Site, DE+EN, Design abgenommen.

### Phase E — Redirects / URL-Erhalt  ⬜
- [ ] Permalinks bewusst erhalten (minimale Redirects); `public/_redirects` je Domain.

### Phase F — Verifikation & Deploy  ⬜
- [ ] **Screenshot-Vergleich alt↔neu** (Playwright, Breakpoints, DE+EN) → „sieht gleich aus".
- [ ] Alle Bilder auflösbar (kein 404); Lighthouse (Perf/A11y).
- [ ] `_headers`/CSP live gegen die realen externen Quellen (YouTube, iframes der Ordinals) prüfen.
- [ ] Deploy auf Cloudflare Pages mit **zwei Custom-Domains** (haushoppe.de + haushoppe.art).

## 8. Verifikations-Kriterien (Definition of Done)

- Zählungen stimmen: **643 Kunstwerke** + das 2021er Werk, alle publish-Seiten je Sprache, Menüs, Medien.
- **Design:** Screenshot-Diff alt↔neu unauffällig auf Kern-Seiten + Galerie (DE+EN, mobil/desktop).
- **Galerie** verhält sich responsiv/interaktiv wie das Original.
- **Bilder:** Rohdaten verlustfrei archiviert; ausgelieferte Bilder scharf, kein 404, akzeptable Größe.
- DE/EN korrekt verknüpft (hreflang, Sprachumschalter), Domain=Sprache.
- Security-Header/CSP aktiv, ohne Embeds (YouTube/Ordinals) zu brechen.

## 9. Status-Log

- **2026-08-07** — Analyse abgeschlossen; Entscheidungen 3. fixiert; dieses Plan-Dokument erstellt.
- **2026-08-07** — Repo `haushoppe/haushoppe.de` (public) angelegt. Tooling-Recon: Docker läuft (nicht nötig), **beide Live-Sites (haushoppe.de/.art) erreichbar → dienen als exakte Design-Referenz** statt Docker-WP; DB-Extraktion per eigenem Node-Parser (kein MySQL nötig). **[D1] entschieden:** ein Astro-Projekt, Inhalte de/en, lokal beide prüfbar, Domain-Split erst beim Deploy.
- **2026-08-07** — **Content-Extraktor** (`migration/extract.mjs`) gebaut + gelaufen → JSON unter `migration/data/`: **645 Kunstwerke** (de 323 / en 322), **19 Seiten** (de 9 / en 10), 18 Menü-Items, **1283 WPML-Paare**, 994 Attachments (alle mit Datei gemappt). Kategorien sauber bilingual (gemaelde/paintings, holzschnitte/woodcuts, zeichnungen/drawings, digitale-kunst/digital-art). Verifiziert: **643/645 Featured-Bilder als Originale auf Platte vorhanden** (0 mit Größen-Suffix). Werk-Metadaten stecken im Titel/Dateinamen → Titel exakt erhalten, Schema schlank. **Roh-Archiv = `wordpress/wp-content/uploads` (unverändert, durabel)**; Web-Ableitungen später ins Repo.
- **2026-08-07** — **Astro-Scaffold + exakte Startseite lokal lauffähig.** Design-CSS von live gezogen (Home+Galerie-Autoptimize vereinigt, 572 KB → `src/styles/wp-design.css`). Header/Footer/Body-Klasse + Home-Article 1:1 aus dem Live-HTML extrahiert (`scripts/scaffold-from-live.mjs` → `src/data/live-*.json`), URLs lokalisiert (Uploads→`/media`, Mail entschlüsselt), 19 Home-Medien kopiert. `BaseLayout.astro` + `index.astro` binden das exakte Astra-Chrome + CSS + selbst gehostete Merriweather ein. **`npm run build` grün; Screenshot-Vergleich: Startseite sieht identisch zur Live-Site aus** (nur das YouTube-Header-Video fehlt noch — `ayg`-Custom-Element, kommt als Facade). **Wichtig gelernt:** der Künstler ist **Olaf Hoppe** (Person-Entität), nicht Johannes.
- **2026-08-07** — **Bild-Pipeline + Galerie fertig.** `scripts/gen-images.mjs` (sharp): 641 Kunstwerk-Originale → webp (max 1400px, q80) nach `public/artworks/` (101,7 MB, gitignored bis Deploy), Maße in `src/data/artworks-media.json`; 2 BMP-Ausreißer offen. **Galerie `/werke`** aus den Daten gebaut: exaktes VP-Markup (`vp-portfolio__item` + Overlay), **justified Layout** (eigenes `public/js/vp-justified.js`, Zeilenhöhe 200/Gap 15/letzte Zeile links, wie VP) + **Kategorie-Filter** (ALLE/Gemälde 285/Holzschnitte 26/Zeichnungen 5/Digitale Kunst 5). Klick → `/portfolio/<slug>/`. **Screenshot-Vergleich: sieht aus wie das Original.** Datenlib `src/lib/artworks.ts`.
- **2026-08-07** — **Detailseiten + Content-Seiten fertig.** `src/pages/portfolio/[slug].astro`: **322 Kunstwerk-Detailseiten** (CreativeWork, H1 + großes lokales Bild) via getStaticPaths. `scripts/scaffold-pages.mjs` + `src/pages/[page].astro`: **Vita/Kontakt/Kunst-Erwerben/Videos** 1:1 aus Live-HTML (48 Medien kopiert). **`npm run build` grün: 327 Seiten.** Screenshot-Vergleich Detail (Riomangore) + Vita: identisch zum Original.
- **2026-08-07** — **EN-Zweig fertig — Seite ist zweisprachig.** `scripts/scaffold-en.mjs` (EN-Chrome/Home/Seiten aus haushoppe.art), `BaseLayout` sprachfähig (`lang`-Prop → DE/EN-Chrome), wiederverwendbare `Gallery.astro` (DRY). EN-Routen: `/en/` (Home), `/en/artwork/` (Galerie, 320 EN-Werke + EN-Filter), `/en/portfolio/<slug>/` (320 Detailseiten), `/en/<page>` (Vita/Contact/Videos/Buy-Fine-Art). **`npm run build`: 653 Seiten.** Screenshot EN-Galerie: korrekt lokalisiert (Menü + „German"-Umschalter).
- **Nächste Schritte (Loop, Feinschliff):** **YouTube-Facade** (Home + Videos-Seite; `ayg`-Element rendert noch nicht), **5 Ordinals** (iframe+Link, invertierte Farben), NFT-Infoseiten (nur fertige), Nav-Aktiv-Zustand pro Seite + Sprachumschalter aufs jeweilige Pendant, 2 BMP-Bilder fixen, `//haushoppe.de`-Plugin-Assets in der CSS lokalisieren. Danach vollständige lokale Abnahme → dann erst Cloudflare-Deploy (braucht deine Secrets = Blocker).
