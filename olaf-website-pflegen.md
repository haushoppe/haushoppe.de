<!--
Kurzanleitung für Olaf: Website-Inhalte ändern und als Pull Request einreichen.
WICHTIG: Änderungen laufen über claude.ai/code (Claude Code on the web) — NICHT über den
claude.ai-Projekt-Chat. Der Projekt-Chat ist read-only und kann nur „Patch-Dateien" erzeugen,
niemals Pull Requests. claude.ai/code ist im Claude-Pro-Abo enthalten (Research Preview).
-->

# HAUS HOPPE — Website ändern (für Olaf)

**Nutze Claude Code im Web: https://claude.ai/code** (in deinem Claude-Pro-Abo). Du beschreibst die Änderung auf Deutsch, Claude macht sie und **pusht einen Branch**; dann klickst du **„Create PR"** — Johannes prüft und gibt frei. (Ein Klick, nicht vollautomatisch.)

> ⚠️ **Nicht** den claude.ai-**Projekt-Chat** für Änderungen nehmen — der ist read-only und erzeugt nur „Patch-Dateien", keine Pull Requests.

## Einmalig — von Johannes (Org-Owner) einzurichten
Die **Claude-GitHub-App** muss auf der Organisation **`haushoppe`** installiert sein, mit **Schreibrecht** auf `haushoppe.de`. Olaf kann das **nicht** selbst — eine App auf einer Organisation zu installieren darf nur ein Owner.
1. **https://github.com/apps/claude** → **Install/Configure** → Organisation **`haushoppe`**.
2. Repository **`haushoppe/haushoppe.de`** auswählen (oder „All repositories").
3. Rechte bestätigen: **Contents: Read & write** + **Pull requests: Read & write**.

> Ohne diese Installation scheitert jeder Push mit **„403 Resource not accessible by integration"** — Claude kann dann lesen/klonen, aber keinen Branch/PR anlegen.

**Für Bild-Upload (Google Drive):** In claude.ai/code → Environment-/Cloud-Einstellungen → **„Network access"** die Google-Drive-Hosts erlauben — unter **„Custom"**: `drive.google.com`, `drive.usercontent.google.com`, `googleusercontent.com` (oder schlicht **„Full"**). Sonst kann Claude keine Dateien aus Drive laden. Und einen **Google-Drive-Ordner mit Olaf teilen**, in den er Fotos legt.

## Olaf — so machst du eine Änderung
1. **https://claude.ai/code** öffnen, anmelden, oben das Repo **`haushoppe/haushoppe.de`** auswählen.
2. **Modus prüfen:** oben muss **„Accept edits"** (oder „Auto") stehen — **nicht „Plan"**. Im Plan-Modus schaut Claude nur, ändert und pusht aber nichts.
3. Die Änderung auf Deutsch beschreiben, z. B.:
   - „Ändere die Öffnungszeiten auf der Kontaktseite auf 14–18 Uhr."
   - „Trag in der Vita die Ausstellung 2025, Kunsthalle Wittenhagen ein."
4. Claude arbeitet, baut die Seite und **pusht einen Branch** → ein **Diff-Indikator** (`+x −y`) erscheint.
5. Auf den Diff klicken → oben **„Create PR"** klicken (oder Claude sagen „Erstelle den Pull Request").
6. Der Pull Request erscheint auf GitHub. **Johannes prüft und merged** → dann ist es automatisch live.

Die Regeln (immer **Deutsch + Englisch**, nur Inhalts-Dateien, Build muss grün sein) stehen im Repo in **`CLAUDE.md`** und werden von claude.ai/code **automatisch geladen** — Claude hält sich daran.

## Fotos & Bilder hinzufügen (über Google Drive)
Ein **ins Chat-Fenster gezogenes Bild** kann Claude **nicht** übernehmen — es *sieht* das Bild nur, hat es aber nicht als Datei. Der Weg für Bilder ist deshalb **Google Drive**:

1. Lade das Foto in den **mit dir geteilten Google-Drive-Ordner** und gib es frei: Rechtsklick → Teilen → **„Jeder, der über den Link verfügt"**.
2. **Link kopieren** und Claude im Chat schicken, z. B.: *„Hier das Foto: <Link> — bau es auf der Seite ‚Kunst & Camping' oben ein."*
3. Claude lädt das Bild aus Drive, **verkleinert es fürs Web** und baut es in **beide Sprachen** ein → ganz normaler PR mit Vorschau.

> Mehrere Bilder? Einfach mehrere Links schicken und dazuschreiben, welches wohin soll.

## Wenn gar kein Branch / kein PR erscheint
- **„403 Resource not accessible by integration" oder kein Branch** → die Claude-GitHub-App fehlt oder hat kein Schreibrecht auf der Org → siehe **„Einmalig — von Johannes"**.
- **Claude ändert nichts** → Modus steht auf **„Plan"** → auf **„Accept edits"** umstellen (Schritt 2).

## Wenn die automatische Prüfung (CI) rot ist
Kein Problem: im PR die **Auto-fix**-Funktion einschalten (oder Claude sagen „behebe die CI-Fehler"), dann korrigiert Claude es selbst und aktualisiert den PR.
