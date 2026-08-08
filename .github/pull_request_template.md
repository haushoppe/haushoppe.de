<!-- Kurz und konkret. Ein PR = eine Sache. Anleitung für KI-Agenten: CLAUDE.md im Repo-Root (Redaktions-Rolle). -->

## Was ändert dieser PR?

<!-- 1–2 Sätze: was und warum. Beispiel: „Vita: Ausstellung 2025 Kunsthalle Wittenhagen ergänzt." -->

## Checkliste (bitte abhaken)

- [ ] Änderung in **Deutsch UND Englisch** gemacht (jede Inhaltsänderung braucht beide Sprachen)
- [ ] Nur **Inhalts-Dateien** angefasst (`src/content/pages/*.mdx`, `src/data/artwork-meta.json`, `src/data/site.ts`, `src/data/artworks*.json`) — **keine** Komponenten/Skripte/Config
- [ ] `npm run check` läuft lokal **grün** (oder: die CI unten ist grün)
- [ ] Echte Umlaute (ä ö ü ß) und typografische Zeichen („ " – ×) verwendet
- [ ] Ein Thema pro PR, aussagekräftiger Titel

> ℹ️ Die **CI** prüft automatisch: Vollständigkeit (DE+EN) + Build beider Sprachen. Ist sie rot, sagt der Log genau, was fehlt.
