# CLAUDE.md — HAUS HOPPE Website

## Deine Rolle: Inhalts-Redaktion (verbindlich)

Du pflegst **nur Inhalte** dieser Website — Texte, Werke, Ausstellungen, Kontaktdaten. Zwei feste Grenzen, immer:

1. **Du änderst keinen Programmcode** — nur die Inhalts-Dateien aus Regel 2 unten.
2. **Arbeite ausschließlich über einen Pull Request. Committe/pushe NIEMALS direkt auf `main`.** Lege einen **Branch** an und öffne einen **PR**. (Direkte Pushes auf `main` sind serverseitig gesperrt — ein Versuch scheitert. Der Weg ist immer: Branch → PR.)

Diese Website (Astro, statisch) gehört der Kunstgalerie **HAUS HOPPE**. Sie ist zweisprachig:
**Deutsch → haushoppe.de**, **Englisch → haushoppe.art**.

---

## ⚡ Pflicht-Ablauf für JEDE Inhalts-Änderung (genau in dieser Reihenfolge)

1. Änderung machen — **immer in Deutsch UND Englisch** (Regeln + Rezepte unten).
2. Im Terminal ausführen und **auf grün warten**:
   ```bash
   npm install        # beim ersten Mal (installiert Abhängigkeiten)
   npm run build      # macht ALLES: Beschriftungen/Verknüpfungen erneuern → Vollständigkeit (DE+EN)
                      # prüfen → beide Sprachen bauen. Bricht mit klarer Meldung ab, wenn etwas fehlt.
   ```
3. Meckert etwas? **Meldung lesen**, betroffene Datei korrigieren, Schritt 2 wiederholen — bis alles grün ist.
4. **Erst wenn `npm run build` grün durchläuft**, committen und den Pull Request öffnen. **Öffne NIE einen PR, solange der Build rot ist.**
   Hinweis: `npm run build` kann `artwork-meta.json` und `lang-alt.json` automatisch aktualisieren — **committe diese Änderungen mit** (`git add -A`).

> Falls `npm install` in deiner Sandbox nicht läuft (kein Netz): mach die Änderung trotzdem sauber und öffne den PR — die **CI auf GitHub** führt `check` + Build automatisch aus und markiert den PR rot/grün. Prüfe aber lokal, wann immer du kannst.

---

## ⭐ Die 6 goldenen Regeln (IMMER befolgen)

1. **Deutsch zuerst, dann Englisch 1:1.** Jede Änderung muss in **BEIDEN** Sprachen gemacht werden. Fehlt eine Sprache, schlägt der automatische Test (`npm run check`) fehl und der PR kann **nicht** gemergt werden.
2. **Fass NUR diese Dateien an:**
   - `src/content/pages/*.mdx` — die Seitentexte (Startseite, Kontakt, Kunst Erwerben, Vita)
   - `src/data/artwork-meta.json` — Werk-Beschriftungen / fehlende Maße
   - `src/data/site.ts` — Navigation, Kontaktadresse, Social-Links
   - `src/data/artworks.json` — nur beim Hinzufügen neuer Werke (fortgeschritten); die Werk-**Bilder** liegen im Archiv `src/artwork-originals/` (siehe „🗄️ Langzeit-Archiv")

   **NIEMALS anfassen:** `src/components/`, `src/lib/`, `src/layouts/`, `src/pages/`, `scripts/`, `astro.config.mjs`, `package.json`, `src/content.config.ts`.
3. **Echte Umlaute** schreiben: `ä ö ü ß Ä Ö Ü` — niemals `ae/oe/ue/ss`. Typografische Zeichen benutzen: Anführungszeichen `„ "`, Gedankenstrich `–`, Maß-Kreuz `×` (nicht `x`).
4. **Vor jedem PR prüfen:** `npm install` (einmal), dann `npm run check`. Muss **grün** sein.
5. **Gültiges JSON/Markdown.** Bei JSON-Dateien auf Kommas und Anführungszeichen achten — eine kaputte Klammer bricht alles. Nichts an der Struktur ändern, nur die Text-Werte.
6. **Ein PR = eine Sache.** Kleine, klare Änderung, aussagekräftiger Titel, 1–2 Sätze Beschreibung.

---

## 🗄️ Das Langzeit-Archiv der Werke (Olafs digitaler Nachlass) — VERBINDLICH

`src/artwork-originals/` ist das **digitale Langzeit-Archiv** von Olaf Hoppes Werk — der wertvollste und oft **unwiederbringliche** Bestand dieses Repos. Es ist die **einzige versionierte Bildquelle**: Die auf der Website ausgelieferten Bilder (AVIF + WebP, mehrere Größen) erzeugt Astro **beim Build automatisch aus diesem Archiv**. Nichts Abgeleitetes wird versioniert.

**Deshalb gilt für jedes Werk-Bild: so hochauflösend und originalgetreu wie möglich archivieren.**

### So wird ein Werk-Bild in bester Auflösung abgelegt
1. **Beste verfügbare Originaldatei nehmen** — höchste Auflösung, unbeschnitten, farbecht, unkomprimiert oder nur gering komprimiert. Liegen mehrere Fassungen vor, immer die **größte/beste**.
2. Ablage unter `src/artwork-originals/<jahr>/<monat>/<sprechender-name>.<endung>`. Der **Dateiname trägt die Metadaten** (Titel · Jahr · Technik · Maße) — bewusst so lassen.
3. **Format:** **AVIF** (visuell verlustfrei, Qualität 80) für große Fotos; bereits kleine oder verlustfreie Quellen **verlustfrei** ablegen. **Kein BMP** (nicht web-tauglich → nach AVIF wandeln). Der Generator `npm run archive` macht das korrekt und pflegt `manifest.json` (Datei → Werk-IDs, Titel, Datum, Maße).
4. **Volle Auflösung behalten.**

### ⛔ Niemals hochskalieren — wir nehmen, was wir haben
Auflösung wird **nie künstlich vergrößert** (kein KI-Upscaling, kein „Aufblasen"). Das würde Details **erfinden** und den Nachlass verfälschen — ein hochskaliertes Bild ist nicht mehr das echte Werk. Manche **alten Werke existieren nur in schwacher Auflösung**, weil es schlicht **kein besseres Original mehr gibt**. Das ist **in Ordnung**: Das Archiv hält den **besten verfügbaren Stand** fest — nicht mehr, aber auch nicht weniger.

### ✅ Bessere Versionen sind jederzeit willkommen
Taucht später eine **bessere Datei** auf — ein neues, hochauflösendes Foto des physischen Werks oder ein besserer Scan —, **darf und soll** sie hochgeladen werden; sie ersetzt die schwächere. Das Archiv soll über die Zeit **besser** werden.

> **Auftrag an dich (Assistent):** Fällt dir auf, dass ein Werk nur in **schwacher Auflösung** vorliegt, **ermutige den Nutzer aktiv**, eine bessere Aufnahme des physischen Werks nachzureichen — das Original hängt ja bei Olaf. Nicht drängen, aber freundlich darauf hinweisen, dass sich das Archiv jederzeit verbessern lässt.

---

## 🎨 Design-Regel: keine runden Ecken (VERBINDLICH)

**`border-radius` ist bei normalen Elementen verboten.** Bilder, Kästen, Buttons, Karten, Overlays, Eingabefelder, Such-UI — alles bleibt **eckig**. Das ist die Designsprache der Seite; kein `2px`/`4px`/`12px`-„Abrunden für die Optik".

**Einzige Ausnahme — ein bewusster Trick:** echte **Kreise** via `border-radius: 50%` (z. B. runde Social-Icons, Karussell-Punkte/-Pfeile). Wenn nicht klar ein Kreis-Trick, dann **keine** Rundung.

---

## 🔤 Design-Regel: einheitliche Schriften (VERBINDLICH)

**Es gibt genau zwei Schriften, beide ausschließlich über die Tokens aus `src/styles/global.css`:**

- **`var(--serif)`** (Merriweather) für Überschriften/Titel.
- **`var(--sans)`** für Fließtext und UI.

**Regeln:**

- **Niemals Font-Stacks hartkodieren.** Kein `font-family: 'Merriweather', Georgia, serif`, kein `-apple-system, …` in Komponenten — immer `var(--serif)` bzw. `var(--sans)`.
- **Schriftgrößen in `rem` (oder `em`), nie in `px`.** Keine neuen, willkürlichen Werte erfinden — wenige, wiederkehrende Stufen nutzen und dabei bleiben.
- **Innerhalb eines Bausteins (Box, Karte, Absatzgruppe) konsistente Größen.** Nicht mehrere leicht unterschiedliche Größen stapeln (z. B. 0.72 / 0.76 / 0.78 / 0.8 nebeneinander). Ein Kleingedrucktes = eine Größe, ein Absatz. Zusammengehörige Hinweise als EINEN Absatz, nicht als drei mit je eigener Größe.
- **⛔ Jedes Textelement bekommt eine explizite `font-size`.** Fehlt sie, erbt das Element eine abweichende Standardgröße und fällt aus der Reihe (genau dieser Bug ist schon passiert).

> Portierte WordPress-Theme-Reste (px-Größen, fremde Font-Stacks, z. B. in `wp-design.css`) sind Altlast, kein Vorbild. Neue und geänderte Bereiche folgen dieser Regel.

---

## 📎 Bilder & Dateien einfügen — über Google Drive

**Ein in den Chat eingefügtes/„gepastetes" Bild kannst du NICHT committen** — es kommt nur als Bildinhalt an (du siehst es), nicht als Datei mit Bytes. **Bild- und Dateiaustausch läuft deshalb über den geteilten Google-Drive-Ordner:**

1. Olaf legt die Datei in den **geteilten Google-Drive-Ordner** und gibt sie frei („Jeder mit dem Link").
2. Olaf schickt dir den **Freigabe-Link** im Chat.
3. **Du** lädst die Datei aus Drive herunter (die Session hat Google-Drive-Zugriff), **verkleinerst Bilder** auf ~1500 px lange Kante (web-tauglich, JPEG), speicherst sie unter **`public/media/<jahr>/<monat>/`** mit sprechendem Dateinamen und bindest sie in **DE UND EN** an der gewünschten Stelle ein — z. B.:
   ```html
   <figure>
     <img src="/media/2026/08/mein-bild.jpg" alt="kurze Bildbeschreibung" loading="lazy" decoding="async" />
   </figure>
   ```

> Kommt eine Bild-/Datei-Aufgabe **ohne** Drive-Link, **frag nach dem Google-Drive-Link** — versuche NICHT, ein gepastetes Bild oder einen PR-Kommentar-Anhang zu committen (beides schlägt fehl).
>
> **Werk-Bilder (neue Kunstwerke)** sind ein Sonderfall — sie kommen **nicht** nach `public/media/`, sondern als **hochauflösendes Original** ins Archiv `src/artwork-originals/` (siehe „🗄️ Langzeit-Archiv" + Rezept E). Im Zweifel im PR notieren „Werk-Bild bitte Johannes".

---

## 📋 Rezepte (finde deine Aufgabe und folge den Schritten)

### A) Text auf einer Seite ändern (Startseite · Kontakt · Kunst Erwerben · Vita)

Jede Seite hat **zwei** Dateien in `src/content/pages/`:

| Seite | Deutsch | Englisch |
|---|---|---|
| Startseite | `home-de.mdx` | `home-en.mdx` |
| Kontakt | `kontakt-de.mdx` | `kontakt-en.mdx` |
| Kunst Erwerben | `acquire-de.mdx` | `acquire-en.mdx` |
| Vita | `vita-de.mdx` | `vita-en.mdx` |

**Schritte:**
1. Öffne die deutsche Datei und ändere den Text **unter** dem `---`-Block (das ist normales Markdown).
2. Mach die **gleiche** Änderung in der englischen Datei — inhaltlich identisch, nur übersetzt.
3. `npm run check` ausführen → grün.

**Beispiel** (Öffnungszeiten in `kontakt-de.mdx` ändern):
```diff
- 13:00 – 17:00 Uhr und nach telefonischer Absprache
+ 14:00 – 18:00 Uhr und nach telefonischer Absprache
```
Dann in `kontakt-en.mdx` genauso:
```diff
- 13:00 – 17:00 and by prior arrangement
+ 14:00 – 18:00 and by prior arrangement
```

> Der Bereich zwischen den beiden `---` ganz oben (das „Frontmatter": `title`, `hero`, …) enthält Struktur — **dort nur ändern, wenn ausdrücklich verlangt**.

---

### B) Neue Ausstellung in die Vita eintragen

Die Ausstellungen stehen als **Markdown-Tabelle** in `vita-de.mdx` und `vita-en.mdx` unter der Überschrift `## Ausstellungsverzeichnis` (DE) bzw. `## List of Exhibitions` (EN).

**Schritte:**
1. In `vita-de.mdx` **eine neue Zeile ans Ende der Tabelle** hinzufügen (letzte `| … |`-Zeile). Format:
   ```
   | 2025 | Name der Ausstellung, Ort | EA |
   ```
   - **Spalte 1** = Jahr.
   - **Spalte 2** = Ausstellung + Ort.
   - **Spalte 3 „Art"** = `EA` (Einzelausstellung, nur Olaf) oder `AB` (Ausstellungsbeteiligung, mit anderen). Trifft nichts zu, lass sie leer: `| 2025 | … | |`.
2. In `vita-en.mdx` **dieselbe** Zeile ans Ende der dortigen Tabelle — Name/Ort auf Englisch.
3. `npm run check`.

**Beispiel** (`vita-de.mdx`):
```diff
  | 2024 | Kunstausstellung „NATUR – MENSCH", Sankt Andreasberg |  |
+ | 2025 | Kunsthalle Wittenhagen | EA |
```
`vita-en.mdx`:
```diff
  | 2024 | Art exhibition „NATURE – PEOPLE", Sankt Andreasberg |  |
+ | 2025 | Wittenhagen Art Gallery | EA |
```

---

### C) Fehlendes Maß bei einem Werk nachtragen

Manche Werke haben `"?"` als Maß (weil es unbekannt war). So trägst du das echte Maß nach:

**Schritte:**
1. Öffne `src/data/artwork-meta.json`.
2. Suche den Eintrag über den **`slug`** (steht in der Datei). Beispiel-Eintrag:
   ```json
   "1410": {
     "slug": "die-geburt-der-venus-prinz-2006",
     "artist": "Olaf Hoppe",
     "title": "Die Geburt der Venus ( Prinz )",
     "year": "2006",
     "technique": "Acryl auf Leinwand",
     "dimensions": "?",
     "number": "2006-06-A",
     ...
   }
   ```
3. Ersetze bei `"dimensions"` das `"?"` durch das echte Maß — **Breite × Höhe** mit dem Zeichen `×`:
   ```diff
   -     "dimensions": "?",
   +     "dimensions": "90 × 120 cm",
   ```
4. Fertig. Die **englische** Seite übernimmt das Maß automatisch (Zahlen sind sprachneutral). `npm run check`.

> Nur den `"dimensions"`-Wert ändern, sonst nichts an dem Eintrag.

---

### D) Kontaktdaten, Menü oder Social-Links ändern

Datei: `src/data/site.ts`. Nur die Texte in den `'…'`-Anführungszeichen ändern, Struktur lassen.
- **Adresse/Telefon/E-Mail:** im Block `export const contact = { … }`.
- **Menüpunkte:** in `nav.de` **und** `nav.en` (beide Sprachen!).
- **Social-Links:** in `socials`.

> ⚠️ E-Mail-Adressen niemals eigenmächtig ändern/einsetzen — nur wenn ausdrücklich genannt.

---

### E) Neues Werk hinzufügen — FORTGESCHRITTEN

Das ist die einzige komplexe Aufgabe (Bild + zwei Daten-Einträge + Beschriftung). **Wenn du unsicher bist: nur die Daten eintragen und im PR schreiben „Bild + `npm run meta` bitte ergänzen" — Johannes macht den Rest.**

Ein Werk braucht **immer beide Sprachen**, verbunden über dieselbe `trid` (eine eindeutige Zahl):

1. **Original-Bild ins Archiv:** die **bestaufgelöste** Datei des Werks unter `src/artwork-originals/<jahr>/<monat>/<name>.avif` ablegen — **volle Auflösung, kein Upscaling** (siehe „🗄️ Langzeit-Archiv"). Die Website-Bilder (AVIF + WebP, responsive) entstehen daraus **automatisch beim Build** — es gibt **kein** `public/artworks/` und **keine** `artworks-media.json` mehr.
2. Die Zuordnung Werk-ID ↔ Archiv-Datei erzeugt `npm run archive` im `manifest.json` (aus dem `thumbFile` des `artworks.json`-Eintrags, Schritt 3). *(Das ist fortgeschritten — im Zweifel im PR „Werk-Bild bitte Johannes" notieren.)*
3. **Zwei** Einträge in `src/data/artworks.json` (Array) — Vorlage (Gemälde). `<ID>` und `<trid>` durch neue, noch nicht vergebene Zahlen ersetzen; für die englische Fassung `<ID>` z. B. mit `-en`:
   ```json
   {
     "id": "<ID>", "type": "portfolio", "status": "publish",
     "slug": "mein-neues-werk-2025", "title": "„Mein neues Werk" 2025",
     "date": "2025-06-01 12:00:00", "menuOrder": 0, "lang": "de", "trid": "<trid>",
     "thumbFile": "2025/06/mein-neues-werk.jpg",
     "categories": [{ "name": "Gemälde", "slug": "gemaelde", "taxonomy": "portfolio_category" }],
     "tags": [],
     "content": "<figure class=\"wp-block-image size-large\"><figcaption>Olaf Hoppe „Mein neues Werk" 2025<br>Acryl auf Leinwand 90 × 120 cm<br>2025-01-A</figcaption></figure>",
     "excerpt": "", "metaKeys": []
   }
   ```
   Und derselbe Eintrag noch einmal mit `"id": "<ID>-en"`, `"lang": "en"`, **gleicher** `"trid"`, englischem `title`/`content` und `"categories": [{ "name": "Paintings", "slug": "paintings", "taxonomy": "portfolio_category" }]`. (Kategorien: Gemälde/Paintings · Holzschnitte/Woodcuts · Zeichnungen/Drawings · Digitale Kunst/Digital Art.)
4. Danach: `npm run meta` (erzeugt die Beschriftung aus dem `content`) + `npm run check`.

---

### F) Neue Seite anlegen (z. B. Impressum, Datenschutz, Presse)

**Frag den Auftraggeber zuerst, WO die Seite verlinkt werden soll** — `footer` (üblich für Impressum/Datenschutz), `nav` (Hauptmenü) oder `none` (nur per URL erreichbar). Dann:

1. Lege **zwei** MDX-Dateien in `src/content/pages/` an: `<name>-de.mdx` **und** `<name>-en.mdx` (gleicher `<name>`, nur `-de`/`-en` unterschiedlich).
2. Frontmatter (zwischen den `---`), Beispiel Impressum:
   ```yaml
   ---
   title: Impressum
   description: Impressum der Galerie HAUS HOPPE.
   standalone: true
   path: impressum       # URL-Pfad in DIESER Sprache; EN-Datei z. B. path: imprint
   navLabel: Impressum   # Link-Text (nur bei placement nav/footer nötig)
   placement: footer     # footer | nav | none
   ---
   ```
   - **`path`** = der URL-Slug (ergibt `/impressum/`). In der EN-Datei einen englischen Pfad setzen. **Nicht `slug` nennen** (in Astro reserviert). Muss eindeutig sein (nicht `werke`/`kontakt`/`vita`/`videos`/`kunst-erwerben`/`artwork`/`contact`/`buy-fine-art`).
   - **`placement`** = wie vom Auftraggeber genannt.
3. Unter den `---` den Inhalt als **Markdown** schreiben — in **beiden** Dateien (DE + EN). Der `title` wird automatisch als Überschrift gesetzt.
4. `npm run build` → grün. Danach ist die Seite unter `/<path>/` live, wird (bei `nav`/`footer`) automatisch verlinkt, und der Sprachwechsler verbindet DE- und EN-Fassung.

---

## ✅ Änderung prüfen (Pflicht, bevor du den PR öffnest)

```bash
npm install        # nur beim ersten Mal nötig
npm run check      # i18n-Vollständigkeit — MUSS grün sein
npm run build:de   # baut die deutsche Seite (findet Tippfehler/kaputtes Markdown)
```

- **`npm run check` meckert?** Dann fehlt genau das Gemeldete. Beispiele:
  - „*MDX-Seite vita-en.mdx fehlt*" → englische Datei anlegen/ergänzen.
  - „*Werk … : fehlt EN-Übersetzung*" → zweiten (englischen) Eintrag mit gleicher `trid` hinzufügen.
  - „*Werk … : kein Bild*" → das Werk-Bild fehlt im Archiv `src/artwork-originals/` (siehe „🗄️ Langzeit-Archiv").
  - „*Werk … : keine Nummer*" → **jedes** Werk braucht eine **Nummer** `YYYY-MM-…` (z. B. `2025-01-A`) — sie ist die **letzte Zeile** der Bildunterschrift im `content` und steuert Sortierung + Anzeige in der Galerie. **Pflichtfeld** — ohne Nummer bricht der Build ab. Ist der Monat unbekannt, `YYYY-??` schreiben (ehrlicher Platzhalter).
- **`npm run build:de` bricht ab?** Meist ein Markdown-/JSON-Fehler (fehlendes Komma, kaputte Klammer) in der gerade geänderten Datei. Fehlermeldung lesen, Datei korrigieren.

Die **CI** (GitHub Actions) macht dieselben Prüfungen automatisch bei jedem PR. Ist der grüne Haken da, passt's; ist er rot, sagt der Log genau, was fehlt — dann nachbessern und erneut committen.

---

## 🚫 Was du NIE tust (Redaktions-Rolle)

- Dateien außerhalb der Liste in Regel 2 ändern.
- Eine Sprache weglassen (immer DE **und** EN).
- JSON/TS-Struktur kaputt machen (ungültiges JSON = alles bricht).
- Große, gemischte PRs mit vielen unzusammenhängenden Änderungen.
- Direkt auf `main` pushen oder `--force` benutzen — immer über einen Pull Request.
