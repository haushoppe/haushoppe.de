# Seitenübergänge (View Transitions)

<!-- gemeinsam:start (Abschnitt geteilt mit dem Schwester-Repo, möglichst synchron halten, nicht zwingend) -->
## Gemeinsam mit der Schwester-Site

haushoppe-its.de und haushoppe.de teilen Code und Verhalten der Seitenübergänge. Beide nutzen Astros `<ClientRouter />`: Beim Klick auf einen internen Link lädt der Router die Zielseite, tauscht das DOM und ruft dabei `document.startViewTransition()` auf. Der Browser fotografiert alte und neue Ansicht und animiert zwischen beiden.

### Geteilte Dateien (mit dem Schwester-Repo geteilt)

| Datei | Inhalt |
|---|---|
| `src/lib/view-transitions.ts` | `vtKey(href)`, `vtName(part, href)`, `vtStyle(part, href)`, `morphOnlyVisible()` |
| `src/styles/view-transitions.css` | alle gemeinsamen Regeln, wird am Anfang der `global.css` importiert |
| `scripts/check-view-transitions.mjs` | Prüfung nach dem Build, Teil von `npm run build` |
| dieser Abschnitt der Doku | zwischen den Markern `gemeinsam:start` und `gemeinsam:end` |

Möglichst in beiden Repos gleich halten, aber nicht zwingend: Bewusste Abweichungen einer Seite sind erlaubt, ein gewisser Drift ist unvermeidbar. Wer eine geteilte Datei ändert, zieht die Änderung nach Möglichkeit im Schwester-Repo nach.

### Was sich bewegt

| Gruppe | Element | Verhalten |
|---|---|---|
| `root` | alles ohne eigenen Namen (v. a. der Footer) | Standard-Überblendung des Browsers |
| `site-header` | `.site-header` | steht still und wechselt ohne Überblendung (alter Schnappschuss ausgeblendet, neuer ohne Animation); ein Überblenden legt den normalen und den fetten aktiven Link übereinander, das flimmert |
| `main` | `.site-main` | alter Inhalt blendet in 160 ms aus, neuer in 260 ms `ease` ein und steigt dabei 8 px auf |
| Klasse `vt-media` | Vorschaubild ↔ großes Bild der Detailseite | wandert und skaliert 520 ms, `cubic-bezier(0.22, 1, 0.36, 1)`, startet 60 ms versetzt; `object-fit: cover`, damit verschiedene Formate nicht verzerren |
| Klasse `vt-title` | Titel der Vorschau ↔ `<h1>` der Detailseite | wandert und skaliert 420 ms; alter und neuer Text blenden in 120 ms über, so wächst der Titel, statt doppelt zu stehen |

Gruppen, die nur auf einer der beiden Seiten vorkommen, blenden im Takt von `main` aus bzw. ein (Regeln mit `:only-child`).

Gewandert wird nur, wenn beide Enden im Bild sind. `morphOnlyVisible()` nimmt jedem `vt-*`-Element außerhalb des Fensters vor dem Übergang den Namen (alte Seite in `astro:after-preparation`, neue Seite in `astro:after-swap`, nach dem Scrollen an die Zielposition). Sein sichtbares Gegenstück blendet dann nur ein bzw. aus, statt quer über den Bildschirm von außerhalb hereinzufliegen. Die Prüfung läuft über `el.style.viewTransitionClass`, nicht über den Text des style-Attributs: Per Skript gesetzte Namen schreibt der Browser mit Leerzeichen (`view-transition-class: vt-media`). Vor jedem Messen gibt sie die zuletzt entfernten Namen zurück: Ein Element, das beim Ankommen unterhalb des Fensters stand, wandert nach dem Herunterscrollen beim nächsten Wechsel wieder. Zurück kommt ein Name nur, solange das Element noch auf `none` steht; ein Skript, das Namen selbst vergibt oder entfernt, behält das letzte Wort. Registriert wird die Funktion einmal, nach allen Skripten, die in `astro:after-swap` noch scrollen.

### Namen

- Jeder Name benennt sein Objekt eindeutig, keine generischen Namen. Schlüssel ist der Pfad der Detailseite: `vtKey()` nimmt nur den Pfad (ohne Query, Hash und Schluss-Slash) und macht aus Sonderzeichen `-`. Ergebnis z. B. `media-blog-2026-10-webmcp`, `title-portfolio-riomaggiore`.
- Pfad statt Slug, weil Slugs über Bereiche hinweg gleich sein können (ein Talk und ein Blogartikel mit demselben Slug), Pfade nicht.
- Seitenspezifische Einzelstücke heißen nach ihrem Objekt, z. B. `portrait-johannes-hoppe`.

### Fallstricke

- **Ein doppelter Name auf einer Seite bricht den ganzen Übergang ab**, die Seite wechselt dann hart. `scripts/check-view-transitions.mjs` lässt den Build in diesem Fall scheitern, ebenso wenn zwei Pfade denselben Schlüssel ergeben (`/a-b` und `/a/b`).
- **Mehrzeilig umbrechende Inline-Elemente kann der Browser nicht fotografieren.** Namen an Block-Elemente oder `inline-block` setzen.
- **Weiches Scrollen nur außerhalb von Übergängen:** `scroll-behavior: smooth` gilt nur für `html:not([data-astro-transition])`. Sonst stellt der Router die Scrollposition beim Zurückgehen weich wieder her, und die ganze Liste rollt sichtbar an die gemerkte Stelle.
- **Spezifität:** `::view-transition-old(name)` ist nicht spezifischer als `::view-transition-old(*.vt-media)`. Seitenspezifische Sonderregeln stehen deshalb in der `global.css` nach dem Import der geteilten Datei.
- **Viele Namen kosten Zeit:** Der Browser erfasst jedes benannte Element einzeln. Gemessen auf haushoppe.de vom Klick bis `transition.ready`: 1 benanntes Bild etwa 33 ms, 37 etwa 34 ms, 325 etwa 255 ms. Lange Listen vergeben den Namen deshalb erst zur Laufzeit an das eine wechselnde Paar.
- **Reduzierte Bewegung:** Alle Regeln und die per Selektor vergebenen Namen stehen in `@media (prefers-reduced-motion: no-preference)`. Inline-Namen gelten immer, deshalb setzt ein eigener Block unter `reduce` alle `::view-transition-*`-Animationen auf `none`.

### Prüfen

- Chrome DevTools, Panel „Animations“, Wiedergabe auf 10 % oder 25 %.
- `document.getAnimations().filter(a => a.effect?.pseudoElement)` direkt nach dem Klick (oder nach `transition.ready`) zeigt Name, Dauer und Verzögerung je Gruppe.
- Aufnahme per Playwright: `recordVideo` im Browser-Kontext, dazu per CDP `Animation.setPlaybackRate` für Zeitlupe.
<!-- gemeinsam:end -->

## Nur auf dieser Site (haushoppe.de): Namen zur Laufzeit

Die Galerie hat über 300 Werke. Anders als auf haushoppe-its.de stehen die Namen deshalb nicht im HTML, sondern `src/scripts/view-transitions.js` vergibt sie beim Wechsel an genau ein Bildpaar. Gemessen (Klick bis `transition.ready`): 1 benanntes Bild etwa 33 ms, alle 325 eingeblendeten Kacheln benannt etwa 255 ms.

- `astro:before-preparation`, alte Seite: das angeklickte Vorschaubild (Link mit Bild auf `/portfolio/<slug>/`), sonst das große Bild der Werkseite (`.art-figure img`).
- `astro:before-swap`, neue Seite: das große Bild, wenn ein Vorschaubild genau dieser Werkseite angeklickt wurde; sonst das Vorschaubild des Werks, von dem man kommt (das n-te, falls es mehrfach verlinkt ist).
- Rückweg in die Galerie: `data-min-shown` lässt `gallery.js` mindestens bis zu diesem Werk einblenden, `gallery.js` legt schon bei `astro:after-swap` aus, und die Kachel wird an die Stelle im Fenster gescrollt, an der sie beim Klick stand. Astros eigene Scroll-Wiederherstellung traf sie bei langen Galerien nicht.
- Ordinals zeigen auf der Werkseite eine Inschrift statt eines Bildes; dort blendet das Vorschaubild nur aus.
- Bei reduzierter Bewegung werden keine Namen vergeben, die Scroll-Korrektur bleibt.

## Fallstricke

- Jeder Name darf pro Seite nur einmal vorkommen, sonst bricht der ganze Übergang ab.
- Benannte Inline-Elemente dürfen nicht über mehrere Zeilen umbrechen; den Namen an ein Block-Element oder ein Bild setzen.
- Was per JS ausgelegt wird, muss vor dem Erfassen der neuen Seite stehen (`astro:after-swap`, nicht erst `astro:page-load`).
- Hover-Zustände: Nach dem Wechsel erkennt der Browser die Maus über einem Element der neuen Seite erst bei der nächsten Mausbewegung. Ein Hover-Effekt auf dem angeklickten Navi-Link fehlt deshalb kurz und baut sich danach neu auf. `Header.astro` setzt in `astro:before-swap` `data-hover` auf den Link der neuen Seite und entfernt es, sobald die Maus ihn verlässt.

## Prüfen

- `e2e/view-transitions.spec.ts` prüft den Morph in beide Richtungen über die laufenden Pseudo-Animationen (`document.getAnimations()` nach `transition.ready`) und erkennt abgebrochene Übergänge. Ein zweiter Test klickt mit der Maus in die Navi: keine Animation an `site-header`, Unterstrich bleibt stehen.
- Von Hand: Chrome DevTools, Panel „Animations“, Wiedergabe auf 10 % oder 25 %.
