# E2E-Testplan (Playwright gegen localhost)

Ziel: **alles**, was wir in die Seite programmiert haben, gegen Regressionen absichern. Jede Seite, jedes Feature, jede Sonderlocke. Läuft **nightly** und per **manuellem Trigger** (nicht bei jedem Commit).

## Infrastruktur
- **Runner:** `@playwright/test` gegen die gebauten statischen Sites.
- **Zwei Sprachen = zwei Server:** `dist-de` auf `:4321` (haushoppe.de), `dist-art` auf `:4322` (haushoppe.art). Zwei Playwright-`projects` (`de`, `en`), jeweils eigener `baseURL`. Zusätzlich Projekte für **Mobile** (iPhone-Viewport).
- **Server:** `python3 -m http.server` je dist-Ordner (kein Extra-Dependency), via `webServer`-Array.
- **Build vorab:** `npm run build` (beide Sprachen). In CI mit demselben Astro-Bild-Cache wie deploy.yml (Content-Hash-Key), damit der Lauf schnell ist.
- **npm-Scripts:** `e2e` (headless), `e2e:ui`, `e2e:report`.

## Testbereiche (je eine Spec-Datei)

### 1. Chrome global + Smoke aller Seiten (`chrome.spec`)
- Für **jede** Kernroute (Home, Videos, Werke + 4 Kategorien, Kunst Erwerben, Vita, Camping, Kontakt, ein Werk-Detail, eine Ordinal-Seite, 404): HTTP 200, `<html lang>` korrekt (de/en), genau **ein `<h1>`**, `<title>` + `meta description` gesetzt, **keine Konsolen-Errors**, **keine Netzwerk-4xx/5xx** (außer bewuste), Favicon-Links vorhanden.
- `link[rel=canonical]` zeigt auf die richtige Domain; `hreflang`-Alternates (de/en/x-default) vorhanden und plausibel.
- View-Transitions-Meta vorhanden (ClientRouter aktiv).

### 2. Header / Navigation (`header.spec`)
- Logo verlinkt auf `/`.
- Menüpunkte je Sprache korrekt (DE: Start/Videos/Werke/Kunst Erwerben/Vita/Camping/Kontakt; EN gespiegelt) und in **einer** Zeile (kein Umbruch).
- **Aktiver** Menüpunkt fett + `aria-current=page`; Werk-Detail markiert „Werke", Kategorie-Seiten markieren „Werke".
- **NEU-Pill** am Menüpunkt „Camping"/„Camping NEW": vorhanden, eckig (border-radius klein), hellgrau, hochgestellt.
- Sprach-Flagge rechts: href zeigt auf die **andere** Domain + korrekten Alt-Pfad (nur href prüfen, nicht cross-origin navigieren).
- Such-Icon vorhanden, öffnet Overlay.
- Hover-Unterstrich-Animation vorhanden (Klasse/Style), aktiver Punkt kein Layout-Ruck (Bold-Breiten-Reserve via `::after data-text`).

### 3. Footer (`footer.spec`)
- Social-Links (Instagram, YouTube) mit korrekten Hrefs + `rel`.
- Kontakt-Block (Name, Adresse, Telefon, E-Mail) vorhanden.

### 4. Homepage (`home.spec`)
- HomeHero: vorhanden, `.ohero`; Höhe via min-height (32rem Desktop / 26rem Mobil).
- **Flush**-Verhalten mobil (`.site-main:has(.ohero)` padding-top:0 ≤720px).
- Kernkontent aus `home-*.mdx` sichtbar.

### 5. Videos (`videos.spec`)
- **SR-only `h1` „Videos"** vorhanden; **kein** großer sichtbarer Player-Titel (`.vg__player-title` existiert nicht mehr).
- YouTube-Facade: Poster sichtbar, Klick lädt `<iframe>` (youtube-nocookie).
- Playlist/Karussell: Thumbnails vorhanden; **Klick auf Thumbnail wechselt oben das Video und scrollt die Seite NICHT** (Scroll-Position bleibt) + aktive Kachel `aria-current=true` + „Wird abgespielt"-Badge.
- Pfeile = geteilte `CarouselArrow` (`.carousel-arrow`), Punkte = geteilte `.carousel-dot` (rund).
- Desktop (≥1000px): Playlist **rechts** neben dem Player (Grid 2 Spalten), Punkte ausgeblendet, Pfeile oben/unten. Mobil: gestapelt, horizontales Scrollen + Punkte.

### 6. Werke-Galerie + Kategorie-Filter (`gallery.spec`)
- `/werke/` (de) bzw. `/artwork/` (en): alle Werke serverseitig im HTML (ohne JS sichtbar).
- Filter-Nav: „Alle" mit **Gesamtzahl**, plus je Kategorie mit **Anzahl** (DE: Holzschnitte **30**, Zeichnungen 5, Gemälde 293, Digitale Kunst 5). Zahlen als Testwerte.
- Filter-Links sind **echte Links** auf `/werke/<kat>/`; Klick navigiert, aktiver Filter markiert (`is-active`, `aria-current=page`).
- Kachel-Hover-Overlay: Titel + Werk-Nummer.
- Justified-Layout/Infinite-Scroll: `.gallery` bekommt `.is-ready` nach JS; erste Charge sofort sichtbar (Progressive Enhancement, ohne JS Raster).

### 7. Werk-Detail (`artwork.spec`)
- `h1` = Werktitel; großes Bild als `<picture>` mit `source[type=image/avif]` + `webp`.
- **ArtworkMeta**-Beschriftung: `Künstler · „Titel" · Jahr`, Technik+Maße-Zeile, **Werk-Nummer** (Badge).
- **Prev/Next-Navigation** (zyklisch) mit Titeln; Links funktionieren.
- **Lightbox:** Klick aufs Bild öffnet Overlay; Vor/Zurück = `CarouselArrow` (`.lightbox__nav`), sichtbar nur auf Werk-Detail; Schließen per Klick + `Esc`; Pfeiltasten blättern.
- Neue **Nummern-Vergabe**: Plovdiv `2015-10`, wintermärchen `2015-11`, porträt 1 `2016-10`, porträt 2 `2016-11` als Badge.

### 8. Ordinals (`ordinals.spec`)
- 5 Ordinal-Detailseiten: schwarze Bühne (`.ordinal-content`), Eyebrow „REVEALED …", `<iframe>` (ordinals.com/ordinalsbot), Buy-Link (gamma.io) `target=_blank rel=noopener`.
- **Kein** „Unverbindlich anfragen"-Button, **kein** Preis.
- Dunkles Theme (`body.theme-invert`), Layout `bleed`.

### 9. Interesse-Anfragen-Mailto (`inquiry.spec`)
- Auf normalen Werk-Detailseiten: dezenter Link „Unverbindlich anfragen"/„Enquire" mit Briefumschlag-Icon.
- `mailto:` an **team@haushoppe.de**; Betreff `Interesse an „Titel" (Nummer)` (EN: `Interest in …`); Body enthält den Interesse-Satz **und den Werk-Link** (`https://haushoppe.de/portfolio/<slug>/`).
- **Titelloses Werk (2016-07-AQ):** Fallback `Werk 2016-07-AQ` (EN `artwork 2016-07-AQ`), keine leeren Anführungszeichen.
- **Ordinals:** kein Anker vorhanden.

### 10. Holzschnitt-Preis (`pricing.spec`)
- Genau **31** Holzschnitt-Detailseiten (de wie en) mit Preis-Block (`data-testid="artwork-price"` in der Kaufbox): zwei Varianten-Karten „785 €" ungerahmt / „1.000 €" gerahmt (HALBE-Museumsrahmen) + Notiz „inkl. 7 % MwSt · versandkostenfrei" (EN „incl. 7% VAT · free shipping"); Vorauswahl ungerahmt.
- **Gemälde/Aquarelle/Zeichnungen/Ordinals:** kein Preis-Markup.
- Holzschnitt-Mail enthält Zeile `Preis: 785 € ungerahmt oder 1.000 € gerahmt (…)` und fragt nach **Verfügbarkeit**; Nicht-Holzschnitt-Mail fragt nach „Verfügbarkeit und Preis" ohne Preis-Zeile.

### 11. Camper-Seite (`camper.spec`, DE + EN)
- Titel „Camper willkommen"/„Campers Welcome"; steht unter `/kunst-und-camping/` bzw. `/art-and-camping/`.
- **PageHero** full-bleed: Bild (`<picture>`), Titel, Lead, CTA „Anrufen"/„Call". Höhe wie HomeHero (min-height 32rem/26rem); **flush** mobil (kein Sprung).
- CTA scrollt zu `#anrufen` (kein `tel:`-Link, sondern Anker; Klick → Element im Viewport).
- **Slideshow:** 6 Slides, **Luftbild zuerst** („Der Hof aus der Luft …"), Captions in richtiger Reihenfolge; **Autostart** (Dot 0→1 nach Intervall); Punkte = `.carousel-dot`, Pfeile = `CarouselArrow`; Klick „weiter" wechselt Slide; `prefers-reduced-motion` → kein Autoplay.
- **Gut-zu-wissen-Bullets:** „**Rastplatz** auf Privatgelände für eine Nacht, kostenfrei" (Rastplatz fett), „Landstrom und Trinkwasser sind vorhanden, kostenfrei", „…oder Grauwasser" (letzter Bullet).
- Hero-Lead: „…Strom und Wasser sind vorhanden, die Ostsee liegt zehn Radminuten entfernt." (kurz).
- **Feuer-Hinweis** unten: `cp-note` mit `NoFireIcon`, Text „…sehr leicht entzündlich … verzichten Sie ganz auf offenes Feuer …".
- **NEU-Pill** im Nav aktiv auf dieser Seite.
- **Keine Gedankenstriche** im Camper-Content (– / —), außer Marken-/Shared-Chrome.

### 12. Kunst Erwerben / Buy Fine Art (`acquire.spec`)
- Hero-Banner, `h1`, Intro-Prosa, Porträt-Bild (float), Akkordeon aus `<details>` (öffnet/schließt, Chevron dreht), Kontakt-Block. Zoombare Bilder (Lightbox-Bindung `.acq-portrait/.acq-gallery`).

### 13. Vita (`vita.spec`)
- `h1`, Biografie-Inhalt, Auszeichnungen/Awards, Bullet-Einrückung korrekt.

### 14. Kontakt / Contact (`contact.spec`)
- Adresse, **beide Telefonnummern** (Festnetz + Mobil) als `tel:`-Links, E-Mail, Anfahrt/Karte.

### 15. Suche (`search.spec`)
- Such-Icon öffnet Overlay; **×/Schließen** funktioniert (der gefixte Bug); Pagefind lädt; eine Beispielsuche liefert Treffer; Esc/Outside-Click schließt.

### 16. Sprachwechsel & hreflang (`i18n.spec`)
- Auf de-Seiten Flag-href → `https://haushoppe.art/<alt-pfad>`; auf en-Seiten → `https://haushoppe.de/<alt-pfad>` (nur href, korrekt gemappt inkl. Kategorie-/Camper-Pfade).
- `hreflang`-Alternates paarweise konsistent (de↔en, x-default=de).
- i18n-Vollständigkeit: jede getestete Seite hat ein Pendant.

### 17. 404 / robots / sitemap / redirects (`meta.spec`)
- `/gibt-es-nicht/` liefert die 404-Seite (Inhalt), Status 404 (soweit vom Static-Server lieferbar → Inhalt prüfen).
- `/robots.txt` erreichbar + enthält Sitemap-Verweis.
- `sitemap-index.xml` erreichbar; enthält Kernrouten, **nicht** die `hidden`/noindex-Werke.
- EN `_redirects` vorhanden (gen-en-redirects), Stichprobe.

### 18. Content-Regeln (`content-rules.spec`)
- **Keine Gedankenstriche** (– / —) im sichtbaren Text der Kernseiten (Ausnahme: seitenweiter Markenname „HAUS HOPPE – Galerie …" in og/JSON-LD/Logo).
- Echte Umlaute (keine „ae/oe/ue"-Transliteration) — Stichprobe auf bekannten Umlaut-Wörtern.

### 19. Link- & Bild-Integrität (`integrity.spec`)
- Auf den Kernseiten: alle **internen** Links (href beginnend mit `/`) liefern 200 (Crawl mit Dedup, begrenzt).
- Alle `<img>`/`<source>` laden (naturalWidth > 0 bzw. Response 200), keine kaputten Assets.

### 20. Mobil-Sonderlocken (`mobile.spec`, iPhone-Viewport)
- **Burger-Menü:** öffnet/schließt; offenes Menü dimmt den Rest (Scrim), Header bleibt klar; Menüreihen daumengroß; grauer Press-Zustand statt blauem Tap-Highlight.
- Hero **flush** direkt unter der Header-Linie (Home + Camping identisch).
- Such-× im mobilen Overlay funktioniert.

### 21. Accessibility-Basics (`a11y.spec`)
- Genau ein `h1` je Seite; Bilder haben `alt` (dekorative leer, inhaltliche gefüllt); sichtbarer Fokuszustand; `aria-current` auf aktivem Nav/Filter; `prefers-reduced-motion` respektiert (Slideshow/Scroll).

## Hinweise / bewusste Grenzen
- Cross-Origin-Sprachwechsel wird **nur über den href** getestet (localhost kann die andere Domain nicht bedienen).
- YouTube-/Ordinal-`iframe`s werden auf **Existenz + korrekte src** getestet, nicht deren Fremdinhalt.
- Werte wie „30 Holzschnitte" sind bewusste Regressions-Anker; ändern sich die Daten legitim, wird der Test mitgezogen.

## GitHub Actions
- Workflow `e2e.yml`: Trigger `schedule` (nightly, z.B. 02:30 UTC) + `workflow_dispatch`. Kein `push`/`pull_request`.
- Schritte: checkout → node → `npm ci` → Astro-Bild-Cache (gleicher Key wie deploy) → `npm run build` → `npx playwright install --with-deps chromium` → `npm run e2e` → Report/Traces als Artifact hochladen.
