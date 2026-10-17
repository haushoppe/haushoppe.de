# Seitenübergänge (View Transitions)

Die Site nutzt Astros `<ClientRouter />` (in `src/layouts/BaseLayout.astro`). Beim Klick auf einen internen Link lädt der Router die Zielseite per Fetch, tauscht das DOM aus und ruft dabei `document.startViewTransition()` auf. Der Browser fotografiert alte und neue Ansicht und animiert zwischen beiden.

## Bausteine

- `src/lib/view-transitions.ts`: `vtKey(href)`, `vtName(part, href)`, `vtStyle(part, href)`. Der Name leitet sich aus dem Pfad der Zielseite ab (`/portfolio/riomaggiore/` → `media-portfolio-riomaggiore`) und benennt damit das Objekt eindeutig. Keine generischen Namen, wo es einen Pfad gibt.
- `src/styles/view-transitions.css`: alle Animationsregeln. Sie hängen an den Klassen `vt-media` und `vt-title`, nicht an einzelnen Namen.
- haushoppe-its.de nutzt dieselben beiden Dateien.

## Was sich bewegt

| Gruppe | Element | Verhalten |
|---|---|---|
| `site-header` | `.site-header` | steht still |
| `main` | `.site-main` | blendet in 160 ms aus, neuer Inhalt in 260 ms ein (8 px Aufstieg) |
| `media-<pfad>` (Klasse `vt-media`) | Werk-Vorschaubild ↔ großes Bild der Werkseite | wandert und skaliert 520 ms, `object-fit: cover` |
| `title-<pfad>` (Klasse `vt-title`) | auf haushoppe.de derzeit nicht vergeben | Regeln liegen bereit |

Was nur auf einer Seite einen Namen trägt, blendet im Takt von `main` aus bzw. ein (`:only-child`).

## Nur auf dieser Site: Namen zur Laufzeit

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

## Prüfen

- `e2e/view-transitions.spec.ts` prüft den Morph in beide Richtungen über die laufenden Pseudo-Animationen (`document.getAnimations()` nach `transition.ready`) und erkennt abgebrochene Übergänge.
- Von Hand: Chrome DevTools, Panel „Animations“, Wiedergabe auf 10 % oder 25 %.
