<!--
Kurzanleitung für Olaf: Website-Inhalte ändern und als Pull Request einreichen.
WICHTIG: Änderungen laufen über claude.ai/code (Claude Code on the web) — NICHT über den
claude.ai-Projekt-Chat. Der Projekt-Chat ist read-only und kann nur „Patch-Dateien" erzeugen,
niemals Pull Requests. claude.ai/code ist im Claude-Pro-Abo enthalten (Research Preview).
-->

# HAUS HOPPE — Website ändern (für Olaf)

**Nutze dafür Claude Code im Web: https://claude.ai/code** — das ist in deinem Claude-Pro-Abo enthalten. Du beschreibst die Änderung auf Deutsch, Claude macht sie und **pusht einen Branch**; dann klickst du **„Create PR"** — Johannes prüft und gibt frei. (Der PR entsteht mit *einem Klick*, nicht vollautomatisch.)

> ⚠️ **Nicht** den normalen claude.ai-**Projekt-Chat** für Änderungen benutzen — der kann nur eine „Patch-Datei" erzeugen, keinen Pull Request. Deshalb hat der erste Versuch nicht geklappt.

## Einmalig einrichten (2 Minuten)
1. **https://claude.ai/code** öffnen, mit deinem Claude-Konto anmelden.
2. Die **Claude-GitHub-App** installieren/autorisieren und dabei **`haushoppe/haushoppe.de` mit Schreibrecht** freigeben (Contents + Pull requests). → [github.com/apps/claude](https://github.com/apps/claude) → *Configure*. **Ohne Schreibrecht kann Claude keinen Branch pushen.**

## Eine Änderung machen
1. Oben das Repo **`haushoppe/haushoppe.de`** auswählen.
2. **Modus prüfen:** oben muss **„Accept edits"** (oder „Auto") stehen — **nicht „Plan"**. Im Plan-Modus schaut Claude nur, ändert und pusht aber nichts.
3. Die Änderung auf Deutsch beschreiben, z. B.:
   - „Ändere die Öffnungszeiten auf der Kontaktseite auf 14–18 Uhr."
   - „Trag in der Vita die Ausstellung 2025, Kunsthalle Wittenhagen ein."
4. Claude arbeitet, baut die Seite und **pusht einen Branch**. Ein **Diff-Indikator** (`+x −y`) erscheint.
5. Auf den Diff klicken → oben **„Create PR"** klicken (oder Claude sagen „Erstelle den Pull Request").
6. Fertig: der Pull Request erscheint auf GitHub. **Johannes prüft und merged** → dann ist es live.

Die Regeln (immer **Deutsch + Englisch**, nur Inhalts-Dateien, Build muss grün sein) stehen im Repo in **`CLAUDE.md`** und werden von claude.ai/code **automatisch geladen**. Du musst dich um nichts kümmern — Claude hält sich daran.

## Wenn gar kein Branch / kein PR erscheint
Fast immer eine dieser zwei Sachen:
- **Modus steht auf „Plan"** → oben auf **„Accept edits"** umstellen (siehe Schritt 2).
- **GitHub-App ohne Schreibrecht** → App auf `haushoppe/haushoppe.de` mit *Contents + Pull requests: write* freigeben ([github.com/apps/claude](https://github.com/apps/claude) → *Configure*).

## Wenn die automatische Prüfung (CI) rot ist
Kein Problem: im PR die **Auto-fix**-Funktion einschalten (oder Claude sagen „behebe die CI-Fehler"), dann korrigiert Claude es selbst und aktualisiert den PR.
