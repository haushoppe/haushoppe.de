# Werke-Archiv — digitaler Nachlass Olaf Hoppe

Master-Archiv der Werke in **voller Auflösung**, visuell verlustfrei. Dies ist die
Quelle: Archiv **und** Build-Vorlage zugleich, vollständig unter Versionsverwaltung.

- Je Werk die höchstaufgelöste Master-Datei, abgelegt unter `JJJJ/MM/`.
- Format: **AVIF q80** (effort 6) — oder das Original byte-genau, falls es kleiner ist.
  Nie hochskalieren; die vorhandene Auflösung bleibt erhalten.
- **Nicht Teil des Deploys** — die Seite liefert die optimierten AVIF/WebP, die der
  Build (`astro:assets`) aus diesen Mastern erzeugt.

## Neues Werk ergänzen

1. Master hierher legen (`JJJJ/MM/aussagekräftiger-name.avif`, volle Auflösung).
2. Werk-Eintrag unter `src/content/artworks/` anlegen; `image:` zeigt relativ auf die
   Master-Datei. `astro:assets` erzeugt daraus die ausgelieferten Web-Bilder.
