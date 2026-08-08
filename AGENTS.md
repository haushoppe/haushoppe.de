# AGENTS.md — Anleitung für KI-Agenten (Inhalts-Änderungen)

**Diese Datei sagt dir — dem KI-Agenten (z. B. Claude über claude.ai/code) — genau, wie du Inhalte dieser Website änderst und als guten Pull Request einreichst. Halte dich Schritt für Schritt daran.**

Diese Website (Astro, statisch) gehört der Kunstgalerie **HAUS HOPPE**. Sie ist zweisprachig:
**Deutsch → haushoppe.de**, **Englisch → haushoppe.art**. Du machst **nur Inhalts-Änderungen**
(Texte, Werke, Ausstellungen, Kontaktdaten). **Du änderst keinen Programmcode.**

---

## ⚡ Pflicht-Ablauf für JEDE Änderung (genau in dieser Reihenfolge)

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
   - `src/data/artworks.json` + `src/data/artworks-media.json` — nur beim Hinzufügen neuer Werke (fortgeschritten)
   
   **NIEMALS anfassen:** `src/components/`, `src/lib/`, `src/layouts/`, `src/pages/`, `scripts/`, `astro.config.mjs`, `package.json`, `src/content.config.ts`.
3. **Echte Umlaute** schreiben: `ä ö ü ß Ä Ö Ü` — niemals `ae/oe/ue/ss`. Typografische Zeichen benutzen: Anführungszeichen `„ "`, Gedankenstrich `–`, Maß-Kreuz `×` (nicht `x`).
4. **Vor jedem PR prüfen:** `npm install` (einmal), dann `npm run check`. Muss **grün** sein.
5. **Gültiges JSON/Markdown.** Bei JSON-Dateien auf Kommas und Anführungszeichen achten — eine kaputte Klammer bricht alles. Nichts an der Struktur ändern, nur die Text-Werte.
6. **Ein PR = eine Sache.** Kleine, klare Änderung, aussagekräftiger Titel, 1–2 Sätze Beschreibung.

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

1. **Bild:** `public/artworks/<ID>.webp` (max. 1400 px lange Kante). *(Kann das Bild nicht committet werden, weil `public/artworks/` in `.gitignore` steht → Johannes fragen.)*
2. **Bildmaße** in `src/data/artworks-media.json` ergänzen:
   ```json
   "<ID>": { "src": "/artworks/<ID>.webp", "w": 1400, "h": 1002 }
   ```
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

## ✅ Änderung prüfen (Pflicht, bevor du den PR öffnest)

```bash
npm install        # nur beim ersten Mal nötig
npm run check      # i18n-Vollständigkeit — MUSS grün sein
npm run build:de   # baut die deutsche Seite (findet Tippfehler/kaputtes Markdown)
```

- **`npm run check` meckert?** Dann fehlt genau das Gemeldete. Beispiele:
  - „*MDX-Seite vita-en.mdx fehlt*" → englische Datei anlegen/ergänzen.
  - „*Werk … : fehlt EN-Übersetzung*" → zweiten (englischen) Eintrag mit gleicher `trid` hinzufügen.
  - „*Werk … : kein Bild*" → Bild + `artworks-media.json`-Eintrag ergänzen.
- **`npm run build:de` bricht ab?** Meist ein Markdown-/JSON-Fehler (fehlendes Komma, kaputte Klammer) in der gerade geänderten Datei. Fehlermeldung lesen, Datei korrigieren.

Die **CI** (GitHub Actions) macht dieselben Prüfungen automatisch bei jedem PR. Ist der grüne Haken da, passt's; ist er rot, sagt der Log genau, was fehlt — dann nachbessern und erneut committen.

---

## 🚫 Was du NIE tust

- Dateien außerhalb der Liste in Regel 2 ändern.
- Eine Sprache weglassen (immer DE **und** EN).
- JSON/TS-Struktur kaputt machen (ungültiges JSON = alles bricht).
- Große, gemischte PRs mit vielen unzusammenhängenden Änderungen.
- Direkt auf `main` pushen oder `--force` benutzen — immer über einen Pull Request.
