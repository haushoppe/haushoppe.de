# Werke-Archiv — digitaler Nachlass Olaf Hoppe

Master-Archiv aller 322 Werke in **voller Auflösung**, visuell verlustfrei.

- Format je Datei: **AVIF q80** (effort 6) — oder das **Original byte-genau**,
  falls AVIF größer gewesen wäre.
- Je Werk die höchstaufgelöste verfügbare Originaldatei.
- **Nicht Teil des Website-Deploys** — die Seite liefert die optimierten webp aus
  `public/artworks/`. Dieses Archiv dient ausschließlich der Langzeit-Sicherung.
- `manifest.json`: Index — Datei → Werk-IDs, Titel (DE/EN), Datum, Maße, Größen.
- Reproduzierbar via `npm run archive` (`scripts/gen-artwork-archive.mjs`).
